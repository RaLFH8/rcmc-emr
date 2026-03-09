/**
 * Duplicate Detector
 * 
 * Identifies existing records in the database to prevent duplicates during import.
 * Supports case-insensitive matching, fuzzy matching for names, and configurable matching strategies.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 18.3
 */

import { supabase } from '../../lib/supabase.js';

/**
 * Duplicate resolution options
 */
export const DuplicateResolution = {
  SKIP: 'skip',
  UPDATE: 'update',
  CREATE_NEW: 'create_new',
  PENDING: 'pending'
};

/**
 * Matching strategies for different data types
 */
export const MatchingStrategy = {
  EXACT: 'exact',
  CASE_INSENSITIVE: 'case_insensitive',
  FUZZY: 'fuzzy',
  COMPOSITE: 'composite'
};

/**
 * Normalize string for comparison (case-insensitive, trimmed, whitespace normalized)
 * 
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeString(str) {
  if (!str) return '';
  return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate Levenshtein distance between two strings (for fuzzy matching)
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1, higher is more similar)
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  if (normalized1 === normalized2) return 1.0;
  if (!normalized1 || !normalized2) return 0.0;

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  return 1 - (distance / maxLength);
}

/**
 * Check if two strings match using fuzzy matching
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @param {number} threshold - Similarity threshold (0-1, default: 0.85)
 * @returns {boolean} True if strings match within threshold
 */
function fuzzyMatch(str1, str2, threshold = 0.85) {
  const similarity = calculateSimilarity(str1, str2);
  return similarity >= threshold;
}

/**
 * Detect duplicate patients by name and date of birth
 * 
 * @param {Array} importData - Array of patient records to check
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Duplicate detection result
 */
export async function detectDuplicatePatients(importData, options = {}) {
  const {
    fuzzyThreshold = 0.85,
    batchSize = 50
  } = options;

  const duplicates = [];
  const uniqueRecords = [];

  // Process in batches to avoid overwhelming the database
  for (let i = 0; i < importData.length; i += batchSize) {
    const batch = importData.slice(i, i + batchSize);
    
    for (const record of batch) {
      // Extract patient name components
      const fullName = record.patient_name || record.name || '';
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts[nameParts.length - 1] || '';

      // Query database for potential matches
      const { data: existingPatients, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%`);

      if (error) {
        console.error('Error querying patients:', error);
        continue;
      }

      // Check for matches
      let bestMatch = null;
      let bestScore = 0;

      for (const existing of existingPatients || []) {
        const existingFullName = `${existing.first_name} ${existing.last_name}`;
        const similarity = calculateSimilarity(fullName, existingFullName);

        // Check date of birth if available
        let dobMatch = true;
        if (record.date_of_birth && existing.date_of_birth) {
          dobMatch = record.date_of_birth === existing.date_of_birth;
        }

        // Consider it a match if name similarity is high and DOB matches
        if (similarity >= fuzzyThreshold && dobMatch && similarity > bestScore) {
          bestMatch = existing;
          bestScore = similarity;
        }
      }

      if (bestMatch) {
        duplicates.push({
          importRow: record,
          existingRecord: bestMatch,
          matchFields: ['patient_name', 'date_of_birth'],
          matchScore: bestScore,
          resolution: DuplicateResolution.PENDING
        });
      } else {
        uniqueRecords.push(record);
      }
    }
  }

  return {
    duplicates,
    uniqueRecords,
    totalChecked: importData.length,
    duplicateCount: duplicates.length,
    uniqueCount: uniqueRecords.length
  };
}

/**
 * Detect duplicate inventory items by name, batch number, and expiration date
 * 
 * @param {Array} importData - Array of inventory items to check
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Duplicate detection result
 */
export async function detectDuplicateInventory(importData, options = {}) {
  const {
    batchSize = 50
  } = options;

  const duplicates = [];
  const uniqueRecords = [];

  // Process in batches
  for (let i = 0; i < importData.length; i += batchSize) {
    const batch = importData.slice(i, i + batchSize);
    
    for (const record of batch) {
      const itemName = normalizeString(record.item_name || record.name || '');
      const batchNumber = record.batch_number || record['Batch Number'] || '';
      const expirationDate = record.expiration_date || record['Expiration Date'] || record.expiry_date || record['Expiry Date'] || '';

      // Build query to check for duplicates
      // Same item is a duplicate only if name + batch + expiry all match
      let query = supabase
        .from('inventory')
        .select('*')
        .ilike('name', itemName);

      // If batch number provided, check for exact batch match
      if (batchNumber) {
        query = query.eq('batch_number', batchNumber);
      }

      // If expiration date provided, check for exact date match
      if (expirationDate) {
        query = query.eq('expiration_date', expirationDate);
      }

      const { data: existingItems, error } = await query;

      if (error) {
        console.error('Error querying inventory:', error);
        continue;
      }

      if (existingItems && existingItems.length > 0) {
        // Found duplicate (same name + batch + expiry)
        duplicates.push({
          importRow: record,
          existingRecord: existingItems[0],
          matchFields: ['name', 'batch_number', 'expiration_date'],
          matchScore: 1.0,
          resolution: DuplicateResolution.PENDING
        });
      } else {
        // Not a duplicate - different batch or expiry date
        uniqueRecords.push(record);
      }
    }
  }

  return {
    duplicates,
    uniqueRecords,
    totalChecked: importData.length,
    duplicateCount: duplicates.length,
    uniqueCount: uniqueRecords.length
  };
}

/**
 * Detect duplicate services by name
 * 
 * @param {Array} importData - Array of services to check
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Duplicate detection result
 */
export async function detectDuplicateServices(importData, options = {}) {
  const {
    batchSize = 50
  } = options;

  const duplicates = [];
  const uniqueRecords = [];

  // Process in batches
  for (let i = 0; i < importData.length; i += batchSize) {
    const batch = importData.slice(i, i + batchSize);
    
    for (const record of batch) {
      const serviceName = normalizeString(record.test_name || record.name || '');

      // Query database for exact match (case-insensitive)
      const { data: existingServices, error } = await supabase
        .from('services')
        .select('*')
        .ilike('name', serviceName);

      if (error) {
        console.error('Error querying services:', error);
        continue;
      }

      if (existingServices && existingServices.length > 0) {
        // Found duplicate
        duplicates.push({
          importRow: record,
          existingRecord: existingServices[0],
          matchFields: ['name'],
          matchScore: 1.0,
          resolution: DuplicateResolution.PENDING
        });
      } else {
        uniqueRecords.push(record);
      }
    }
  }

  return {
    duplicates,
    uniqueRecords,
    totalChecked: importData.length,
    duplicateCount: duplicates.length,
    uniqueCount: uniqueRecords.length
  };
}

/**
 * Detect duplicate laboratory tests by name (handles alternative names with "/")
 * 
 * @param {Array} importData - Array of lab tests to check
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Duplicate detection result
 */
export async function detectDuplicateLabTests(importData, options = {}) {
  const {
    batchSize = 50
  } = options;

  const duplicates = [];
  const uniqueRecords = [];

  // Process in batches
  for (let i = 0; i < importData.length; i += batchSize) {
    const batch = importData.slice(i, i + batchSize);
    
    for (const record of batch) {
      const testName = record.test_name || record.name || '';
      
      // Handle alternative names (e.g., "CBC / Complete Blood Count")
      const names = testName.split('/').map(n => normalizeString(n));
      const primaryName = names[0];

      // Query database for matches on any of the names
      let existingTests = [];
      for (const name of names) {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .ilike('name', name)
          .eq('category', 'Laboratory');

        if (!error && data && data.length > 0) {
          existingTests = data;
          break;
        }
      }

      if (existingTests.length > 0) {
        // Found duplicate
        duplicates.push({
          importRow: record,
          existingRecord: existingTests[0],
          matchFields: ['name'],
          matchScore: 1.0,
          resolution: DuplicateResolution.PENDING
        });
      } else {
        uniqueRecords.push(record);
      }
    }
  }

  return {
    duplicates,
    uniqueRecords,
    totalChecked: importData.length,
    duplicateCount: duplicates.length,
    uniqueCount: uniqueRecords.length
  };
}

/**
 * Generic duplicate detection with custom matching function
 * 
 * @param {Array} importData - Array of records to check
 * @param {string} tableName - Database table name
 * @param {Function} matchFunction - Custom matching function (record) => query
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Duplicate detection result
 */
export async function detectDuplicates(importData, tableName, matchFunction, options = {}) {
  const {
    batchSize = 50
  } = options;

  const duplicates = [];
  const uniqueRecords = [];

  // Process in batches
  for (let i = 0; i < importData.length; i += batchSize) {
    const batch = importData.slice(i, i + batchSize);
    
    for (const record of batch) {
      // Use custom match function to build query
      const query = matchFunction(record, supabase.from(tableName).select('*'));
      const { data: existingRecords, error } = await query;

      if (error) {
        console.error(`Error querying ${tableName}:`, error);
        continue;
      }

      if (existingRecords && existingRecords.length > 0) {
        // Found duplicate
        duplicates.push({
          importRow: record,
          existingRecord: existingRecords[0],
          matchFields: Object.keys(record),
          matchScore: 1.0,
          resolution: DuplicateResolution.PENDING
        });
      } else {
        uniqueRecords.push(record);
      }
    }
  }

  return {
    duplicates,
    uniqueRecords,
    totalChecked: importData.length,
    duplicateCount: duplicates.length,
    uniqueCount: uniqueRecords.length
  };
}

/**
 * Set resolution for a duplicate match
 * 
 * @param {Object} duplicate - Duplicate match object
 * @param {string} resolution - Resolution choice (skip, update, create_new)
 * @returns {Object} Updated duplicate object
 */
export function setDuplicateResolution(duplicate, resolution) {
  if (!Object.values(DuplicateResolution).includes(resolution)) {
    throw new Error(`Invalid resolution: ${resolution}`);
  }

  return {
    ...duplicate,
    resolution
  };
}

/**
 * Filter data based on duplicate resolutions
 * 
 * @param {Array} importData - Original import data
 * @param {Array} duplicates - Array of duplicate matches with resolutions
 * @returns {Object} Filtered data by resolution type
 */
export function filterByResolution(importData, duplicates) {
  const toSkip = [];
  const toUpdate = [];
  const toCreate = [];
  const pending = [];

  // Create a map of import rows to their resolutions
  const resolutionMap = new Map();
  duplicates.forEach(dup => {
    resolutionMap.set(dup.importRow, dup);
  });

  // Categorize each record
  importData.forEach(record => {
    const duplicate = resolutionMap.get(record);
    
    if (!duplicate) {
      // Not a duplicate, create new
      toCreate.push(record);
    } else {
      switch (duplicate.resolution) {
        case DuplicateResolution.SKIP:
          toSkip.push(record);
          break;
        case DuplicateResolution.UPDATE:
          toUpdate.push({
            importRow: record,
            existingRecord: duplicate.existingRecord
          });
          break;
        case DuplicateResolution.CREATE_NEW:
          toCreate.push(record);
          break;
        case DuplicateResolution.PENDING:
          pending.push(record);
          break;
      }
    }
  });

  return {
    toSkip,
    toUpdate,
    toCreate,
    pending,
    skipCount: toSkip.length,
    updateCount: toUpdate.length,
    createCount: toCreate.length,
    pendingCount: pending.length
  };
}

/**
 * Get duplicate summary statistics
 * 
 * @param {Object} detectionResult - Result from duplicate detection
 * @returns {Object} Summary statistics
 */
export function getDuplicateSummary(detectionResult) {
  const { duplicates, uniqueRecords, totalChecked } = detectionResult;

  const resolutionCounts = {
    [DuplicateResolution.SKIP]: 0,
    [DuplicateResolution.UPDATE]: 0,
    [DuplicateResolution.CREATE_NEW]: 0,
    [DuplicateResolution.PENDING]: 0
  };

  duplicates.forEach(dup => {
    resolutionCounts[dup.resolution]++;
  });

  return {
    totalChecked,
    duplicateCount: duplicates.length,
    uniqueCount: uniqueRecords.length,
    duplicatePercentage: ((duplicates.length / totalChecked) * 100).toFixed(2),
    resolutionCounts,
    allResolved: resolutionCounts[DuplicateResolution.PENDING] === 0
  };
}

/**
 * Format duplicate match for display
 * 
 * @param {Object} duplicate - Duplicate match object
 * @returns {string} Formatted display string
 */
export function formatDuplicateMatch(duplicate) {
  const { importRow, existingRecord, matchFields, matchScore } = duplicate;
  
  const matchFieldsStr = matchFields.join(', ');
  const scorePercent = (matchScore * 100).toFixed(0);
  
  return `Match found (${scorePercent}% similar on ${matchFieldsStr})`;
}

/**
 * Check if duplicate detection is complete (all resolutions set)
 * 
 * @param {Array} duplicates - Array of duplicate matches
 * @returns {boolean} True if all duplicates have resolutions
 */
export function isDuplicateResolutionComplete(duplicates) {
  return duplicates.every(dup => dup.resolution !== DuplicateResolution.PENDING);
}

/**
 * Cache for duplicate detection results (session-based)
 */
const detectionCache = new Map();

/**
 * Get cached duplicate detection result
 * 
 * @param {string} cacheKey - Cache key
 * @returns {Object|null} Cached result or null
 */
export function getCachedDetectionResult(cacheKey) {
  return detectionCache.get(cacheKey) || null;
}

/**
 * Set cached duplicate detection result
 * 
 * @param {string} cacheKey - Cache key
 * @param {Object} result - Detection result to cache
 */
export function setCachedDetectionResult(cacheKey, result) {
  detectionCache.set(cacheKey, result);
}

/**
 * Clear duplicate detection cache
 */
export function clearDetectionCache() {
  detectionCache.clear();
}

/**
 * Generate cache key for duplicate detection
 * 
 * @param {string} tableName - Table name
 * @param {Array} importData - Import data
 * @returns {string} Cache key
 */
export function generateCacheKey(tableName, importData) {
  const dataHash = JSON.stringify(importData.map(r => Object.values(r).join('|')));
  return `${tableName}_${dataHash.length}_${Date.now()}`;
}
