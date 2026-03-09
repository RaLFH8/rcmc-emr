/**
 * Lab Test Import Service
 * 
 * Handles importing laboratory tests with:
 * - 15-category classification
 * - Special notation parsing (each, /, packages)
 * - Unique service code generation
 * - Turnaround time extraction
 * 
 * Security: Requires authenticated user with admin or staff role
 * 
 * Requirements: 4.8
 */

import { db } from '../../lib/supabase';
import { categorizeLabTest } from '../../utils/import/labTestCategorizer';
import { parseCompleteLabTest } from '../../utils/import/labTestNotationParser';
import { generateServiceCode } from '../../utils/import/serviceCodeGenerator';
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
 * Import a single laboratory test
 * 
 * @param {Object} row - CSV row data
 * @param {Object} userProfile - User profile from AuthContext (for authentication)
 * @returns {Promise<Object>} Import result
 */
export async function importLabTest(row, userProfile = null) {
  // Check authentication
  if (userProfile) {
    checkAuthentication(userProfile)
  }
  
  try {
    // Sanitize input data (Requirement: 20.5)
    const sanitizedRow = sanitizeObject(row, {
      test_name: { type: 'string' },
      'Test Name': { type: 'string' },
      name: { type: 'string' },
      price: { type: 'number', options: { min: 0.01, allowNegative: false } },
      'Price': { type: 'number', options: { min: 0.01, allowNegative: false } },
      description: { type: 'string' },
      'Description': { type: 'string' },
      turnaround_time: { type: 'string' },
      'Turnaround Time': { type: 'string' }
    });
    
    // Parse test data
    const testName = sanitizeString(sanitizedRow.test_name || sanitizedRow['Test Name'] || sanitizedRow.name);
    const price = sanitizeNumber(sanitizedRow.price || sanitizedRow['Price'] || 0, { min: 0.01, allowNegative: false });
    const description = sanitizeString(sanitizedRow.description || sanitizedRow['Description'] || '');
    const turnaroundTime = sanitizeString(sanitizedRow.turnaround_time || sanitizedRow['Turnaround Time'] || '');

    if (!testName || testName.trim() === '') {
      throw new Error('Test name is required');
    }

    if (!price || price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    // Categorize test
    const category = categorizeLabTest({ name: testName });

    // Parse special notations
    const parsedTest = parseCompleteLabTest({
      name: testName,
      description: description,
      turnaround_time: turnaroundTime
    });

    // Generate unique service code
    const serviceCode = await generateServiceCode(parsedTest.name, category);

    // Build description with all metadata
    const descriptionParts = [];
    
    if (parsedTest.alternative_names.length > 0) {
      descriptionParts.push(sanitizeString(`Also known as: ${parsedTest.alternative_names.join(', ')}`));
    }
    
    if (parsedTest.turnaround_time) {
      descriptionParts.push(sanitizeString(`Turnaround: ${parsedTest.turnaround_time}`));
    }
    
    if (parsedTest.per_item_pricing) {
      descriptionParts.push('Priced per item');
    }
    
    if (parsedTest.is_package && parsedTest.included_tests.length > 0) {
      descriptionParts.push(sanitizeString(`Includes: ${parsedTest.included_tests.join(', ')}`));
    }
    
    if (description && !descriptionParts.some(part => part.includes(description))) {
      descriptionParts.push(description);
    }

    const finalDescription = descriptionParts.join(' | ');

    // Insert into services table
    const service = await db.addService({
      name: parsedTest.name,
      service_code: serviceCode,
      category: category,
      price: price,
      description: finalDescription || null,
      status: 'Active'
    });

    return {
      success: true,
      category: category,
      service_code: serviceCode,
      is_package: parsedTest.is_package,
      per_item_pricing: parsedTest.per_item_pricing,
      record: service
    };
  } catch (error) {
    throw new Error(`Failed to import lab test: ${error.message}`);
  }
}

/**
 * Batch import laboratory tests with audit logging
 * @param {Array} rows - Array of CSV row data
 * @param {Function} onProgress - Progress callback
 * @param {Object} userProfile - User profile from AuthContext (for authentication)
 * @param {string} filename - Original CSV filename (for audit logging)
 * @returns {Promise<Object>} Import results
 */
export async function batchImportLabTests(rows, onProgress, userProfile = null, filename = 'unknown.csv') {
  // Check authentication once at the start
  if (userProfile) {
    checkAuthentication(userProfile)
  }
  
  // Start audit log (Requirement: 19.1)
  let logId = null;
  if (userProfile) {
    try {
      logId = await startImportLog({
        moduleType: 'lab_test',
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
    categoryBreakdown: {}
  };

  // Initialize category breakdown with all 15 categories
  const categories = [
    'Hematology', 'Clinical_Chemistry', 'Serology', 'Microbiology',
    'Urinalysis', 'Fecalysis', 'Immunology', 'Toxicology',
    'Molecular_Diagnostics', 'Histopathology', 'Cytology',
    'Blood_Banking', 'Coagulation_Studies', 'Endocrinology', 'Special_Tests'
  ];
  categories.forEach(cat => {
    results.categoryBreakdown[cat] = 0;
  });

  try {
    for (let i = 0; i < rows.length; i++) {
      try {
        // Don't check auth for each row, already checked above
        const result = await importLabTest(rows[i], null);
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
            status: `Importing test ${i + 1} of ${rows.length}`
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
 * Validate lab test import data
 * @param {Array} rows - Array of CSV row data
 * @returns {Array} Validation errors
 */
export function validateLabTestData(rows) {
  const errors = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    // Check required fields
    const testName = row.test_name || row['Test Name'] || row.name;
    if (!testName || testName.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'test_name',
        value: testName,
        type: 'missing',
        message: 'Missing required field: test_name'
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
  });

  return errors;
}

/**
 * Preview categorization and parsing for lab tests
 * @param {Array} rows - Array of CSV row data
 * @returns {Object} Categorization and parsing preview
 */
export function previewLabTestCategorization(rows) {
  const preview = {
    tests: [],
    breakdown: {}
  };

  // Initialize breakdown with all 15 categories
  const categories = [
    'Hematology', 'Clinical_Chemistry', 'Serology', 'Microbiology',
    'Urinalysis', 'Fecalysis', 'Immunology', 'Toxicology',
    'Molecular_Diagnostics', 'Histopathology', 'Cytology',
    'Blood_Banking', 'Coagulation_Studies', 'Endocrinology', 'Special_Tests'
  ];
  categories.forEach(cat => {
    preview.breakdown[cat] = 0;
  });

  rows.forEach((row, index) => {
    const testName = row.test_name || row['Test Name'] || row.name;
    const price = parseFloat(row.price || row['Price'] || 0);
    const description = row.description || row['Description'] || '';
    const turnaroundTime = row.turnaround_time || row['Turnaround Time'] || '';

    const category = categorizeLabTest({ name: testName });
    const parsedTest = parseCompleteLabTest({
      name: testName,
      description: description,
      turnaround_time: turnaroundTime
    });

    preview.tests.push({
      row: index + 1,
      name: parsedTest.name,
      price,
      category,
      alternative_names: parsedTest.alternative_names,
      per_item_pricing: parsedTest.per_item_pricing,
      is_package: parsedTest.is_package,
      turnaround_time: parsedTest.turnaround_time
    });

    preview.breakdown[category]++;
  });

  return preview;
}

export default {
  importLabTest,
  batchImportLabTests,
  validateLabTestData,
  previewLabTestCategorization
};
