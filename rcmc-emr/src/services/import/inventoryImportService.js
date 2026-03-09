/**
 * Inventory Import Service
 * 
 * Handles importing inventory items with automatic categorization:
 * - Services → services table
 * - Medicines → inventory table (category='Medicine')
 * - Medical_Supplies → inventory table (category='Supplies')
 * 
 * Security: Requires authenticated user with admin or staff role
 * 
 * Requirements: 3.7, 3.8, 3.11
 */

import { supabase, db } from '../../lib/supabase';
import { categorizeInventoryItem, extractDosage, standardizeUnit } from '../../utils/import/inventoryCategorizer';
import { sanitizeString, sanitizeNumber, sanitizeObject } from '../../utils/import/inputSanitizer';
import { startImportLog, updateImportLog, completeImportLog, logError, failImportLog } from '../../utils/import/auditLogger';

/**
 * Check if user is authenticated and has proper role
 * @param {Object} userProfile - User profile from AuthContext
 * @throws {Error} If user is not authenticated or doesn't have proper role
 */
function checkAuthentication(userProfile) {
  if (!userProfile) {
    throw new Error('Authentication required: You must be logged in to import data')
  }
  
  const allowedRoles = ['admin', 'staff']
  if (!allowedRoles.includes(userProfile.role)) {
    throw new Error(`Authorization failed: Only admin and staff users can import data. Your role: ${userProfile.role}`)
  }
}

/**
 * Generate item code for inventory items
 * @param {string} itemName - Item name
 * @returns {string} Item code
 */
function generateItemCode(itemName) {
  // Take first 3 letters of each word, uppercase
  const words = itemName.trim().split(/\s+/);
  const code = words
    .map(word => word.substring(0, 3).toUpperCase())
    .join('');
  
  // Add random suffix to ensure uniqueness
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${code}-${suffix}`;
}

/**
 * Import a single inventory item
 * Routes to appropriate table based on category
 * 
 * @param {Object} row - CSV row data
 * @param {Object} userProfile - User profile from AuthContext (for authentication)
 * @returns {Promise<Object>} Import result
 */
export async function importInventoryItem(row, userProfile = null) {
  // Check authentication
  if (userProfile) {
    checkAuthentication(userProfile)
  }
  
  try {
    // Sanitize input data (Requirement: 20.5)
    const sanitizedRow = sanitizeObject(row, {
      item_name: { type: 'string' },
      'Item Name': { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number', options: { min: 0.01, allowNegative: false } },
      'Price': { type: 'number', options: { min: 0.01, allowNegative: false } },
      unit: { type: 'string' },
      'Unit': { type: 'string' },
      stock: { type: 'number', options: { min: 0, allowNegative: false } },
      'Stock': { type: 'number', options: { min: 0, allowNegative: false } },
      batch_number: { type: 'string' },
      'Batch Number': { type: 'string' },
      lot_number: { type: 'string' },
      'Lot Number': { type: 'string' },
      expiration_date: { type: 'string' },
      'Expiration Date': { type: 'string' },
      expiry_date: { type: 'string' },
      'Expiry Date': { type: 'string' }
    });
    
    // Parse item data
    const itemName = sanitizeString(sanitizedRow.item_name || sanitizedRow['Item Name'] || sanitizedRow.name);
    const price = sanitizeNumber(sanitizedRow.price || sanitizedRow['Price'] || 0, { min: 0.01, allowNegative: false });
    const unit = sanitizeString(sanitizedRow.unit || sanitizedRow['Unit'] || '');
    const stock = sanitizeNumber(sanitizedRow.stock || sanitizedRow['Stock'] || 0, { min: 0, allowNegative: false }) || 0;
    const batchNumber = sanitizeString(sanitizedRow.batch_number || sanitizedRow['Batch Number'] || '');
    const lotNumber = sanitizeString(sanitizedRow.lot_number || sanitizedRow['Lot Number'] || '');
    const expirationDate = sanitizeString(sanitizedRow.expiration_date || sanitizedRow['Expiration Date'] || sanitizedRow.expiry_date || sanitizedRow['Expiry Date'] || '');

    if (!itemName || itemName.trim() === '') {
      throw new Error('Item name is required');
    }

    if (!price || price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    // Categorize item
    const category = categorizeInventoryItem({ name: itemName, price, unit });
    
    // Extract dosage and standardize unit
    const dosage = extractDosage(itemName);
    const standardizedUnit = standardizeUnit(unit);

    // Route to appropriate table
    if (category === 'Services') {
      // Insert into services table
      const service = await db.addService({
        name: itemName,
        category: 'Laboratory', // Default category
        price: price,
        description: dosage ? sanitizeString(`Dosage: ${dosage.amount}${dosage.unit}`) : '',
        status: 'Active'
      });

      return {
        success: true,
        category: 'Services',
        record: service
      };
    } else {
      // Insert into inventory table
      const inventoryCategory = category === 'Medicines' ? 'Medicine' : 'Supplies';
      
      // Generate batch number if not provided
      const finalBatchNumber = batchNumber || `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const item = await db.addInventoryItem({
        name: itemName,
        item_code: generateItemCode(itemName),
        category: inventoryCategory,
        unit_price: price,
        stock: stock,
        unit: standardizedUnit || unit,
        reorder_level: Math.max(10, Math.floor(stock * 0.2)), // 20% of initial stock
        batch_number: finalBatchNumber,
        lot_number: lotNumber || null,
        expiration_date: expirationDate || null,
        status: stock > 0 ? 'In Stock' : 'Out of Stock'
      });

      return {
        success: true,
        category: category,
        record: item
      };
    }
  } catch (error) {
    throw new Error(`Failed to import inventory item: ${error.message}`);
  }
}

/**
 * Batch import inventory items with audit logging
 * @param {Array} rows - Array of CSV row data
 * @param {Function} onProgress - Progress callback
 * @param {Object} userProfile - User profile from AuthContext (for authentication)
 * @param {string} filename - Original CSV filename (for audit logging)
 * @returns {Promise<Object>} Import results
 */
export async function batchImportInventory(rows, onProgress, userProfile = null, filename = 'unknown.csv') {
  // Check authentication once at the start
  if (userProfile) {
    checkAuthentication(userProfile)
  }
  
  // Start audit log (Requirement: 19.1)
  let logId = null;
  if (userProfile) {
    try {
      logId = await startImportLog({
        moduleType: 'inventory',
        filename: filename,
        totalRecords: rows.length,
        userId: userProfile.id,
        username: userProfile.username || userProfile.email || 'Unknown User'
      });
    } catch (error) {
      console.error('Failed to start audit log:', error);
      // Continue with import even if logging fails
    }
  }
  
  const results = {
    total: rows.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    categoryBreakdown: {
      Services: 0,
      Medicines: 0,
      Medical_Supplies: 0
    }
  };

  try {
    for (let i = 0; i < rows.length; i++) {
      try {
        // Don't check auth for each row, already checked above
        const result = await importInventoryItem(rows[i], null);
        results.successful++;
        results.categoryBreakdown[result.category]++;

        // Update audit log progress (Requirement: 19.1, 19.4)
        if (logId) {
          await updateImportLog(logId, {
            successfulRecords: results.successful,
            failedRecords: results.failed,
            skippedRecords: results.skipped,
            categoryBreakdown: results.categoryBreakdown
          });
        }

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: rows.length,
            percentage: Math.round(((i + 1) / rows.length) * 100),
            status: `Importing item ${i + 1} of ${rows.length}`
          });
        }
      } catch (error) {
        results.failed++;
        
        const errorInfo = {
          row: i + 1,
          data: rows[i],
          error: error.message
        };
        
        // Capture stack trace for detailed error logging (Requirement: 19.3, 19.6, 19.7)
        if (error.stack) {
          errorInfo.stack = error.stack;
        }
        
        results.errors.push(errorInfo);
        
        // Log error to audit log
        if (logId) {
          await logError(logId, errorInfo);
        }
      }
    }

    // Complete audit log with final results (Requirement: 19.1, 19.2, 19.3, 19.4)
    if (logId) {
      await completeImportLog(logId, {
        successful: results.successful,
        failed: results.failed,
        skipped: results.skipped,
        categoryBreakdown: results.categoryBreakdown,
        errors: results.errors,
        status: 'completed'
      });
    }

    return results;
  } catch (error) {
    // Mark import as failed in audit log
    if (logId) {
      await failImportLog(logId, error.message, error.stack);
    }
    throw error;
  }
}

/**
 * Validate inventory import data
 * @param {Array} rows - Array of CSV row data
 * @returns {Array} Validation errors
 */
export function validateInventoryData(rows) {
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    // Check required fields
    const itemName = row.item_name || row['Item Name'] || row.name;
    if (!itemName || itemName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'item_name',
        value: itemName,
        type: 'missing',
        message: 'Missing required field: item_name'
      });
    }

    const price = row.price || row['Price'];
    if (!price || price === '') {
      errors.push({
        row: rowNumber,
        field: 'price',
        value: price,
        type: 'missing',
        message: 'Missing required field: price'
      });
    } else {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        errors.push({
          row: rowNumber,
          field: 'price',
          value: price,
          type: 'out_of_range',
          message: 'Price must be greater than 0'
        });
      }
    }

    // Validate optional numeric fields
    const stock = row.stock || row['Stock'];
    if (stock !== undefined && stock !== '' && stock !== null) {
      const parsedStock = parseInt(stock);
      if (isNaN(parsedStock) || parsedStock < 0) {
        errors.push({
          row: rowNumber,
          field: 'stock',
          value: stock,
          type: 'invalid_type',
          message: 'Stock must be a non-negative integer'
        });
      }
    }
  });

  return errors;
}

/**
 * Preview categorization for inventory items
 * @param {Array} rows - Array of CSV row data
 * @returns {Object} Categorization preview
 */
export function previewCategorization(rows) {
  const preview = {
    items: [],
    breakdown: {
      Services: 0,
      Medicines: 0,
      Medical_Supplies: 0
    }
  };

  rows.forEach((row, index) => {
    const itemName = row.item_name || row['Item Name'] || row.name;
    const price = parseFloat(row.price || row['Price'] || 0);
    const unit = row.unit || row['Unit'] || '';

    const category = categorizeInventoryItem({ name: itemName, price, unit });
    const dosage = extractDosage(itemName);

    preview.items.push({
      row: index + 1,
      name: itemName,
      price,
      unit,
      category,
      dosage: dosage ? `${dosage.amount}${dosage.unit}` : null
    });

    preview.breakdown[category]++;
  });

  return preview;
}

export default {
  importInventoryItem,
  batchImportInventory,
  validateInventoryData,
  previewCategorization
};
