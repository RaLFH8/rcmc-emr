/**
 * CSV Parser Utility
 * 
 * Provides CSV parsing functionality using papaparse library.
 * Handles file upload, parsing, error handling, and UTF-8 encoding.
 * 
 * Requirements: 1.2, 1.3, 1.4, 1.6, 1.8, 1.9, 11.2, 11.3, 11.4, 11.5
 */

import Papa from 'papaparse';
import { validateFile } from './inputSanitizer';

/**
 * Parse a CSV file and return structured data
 * 
 * @param {File} file - The CSV file to parse
 * @returns {Promise<ParseResult>} - Parsed data with headers and rows
 */
export async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject({
        success: false,
        error: {
          message: 'No file provided',
          code: 'NO_FILE'
        }
      });
      return;
    }

    // Validate file type and size (Requirements: 20.6, 20.7)
    const fileValidation = validateFile(file, {
      allowedTypes: [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      allowedExtensions: ['csv', 'xls', 'xlsx'],
      maxSizeBytes: 5 * 1024 * 1024 // 5MB limit
    });

    if (!fileValidation.isValid) {
      reject({
        success: false,
        error: {
          message: fileValidation.error,
          code: 'INVALID_FILE'
        }
      });
      return;
    }

    // Configure papaparse
    Papa.parse(file, {
      header: true,              // Auto-detect headers from first row
      skipEmptyLines: true,      // Ignore blank rows
      dynamicTyping: true,       // Auto-convert numbers
      trimHeaders: true,         // Trim header whitespace
      encoding: 'UTF-8',         // Support UTF-8 special characters
      
      // Transform headers to trim whitespace
      transformHeader: (header) => {
        return header.trim();
      },
      
      // Transform values to trim whitespace for strings
      transform: (value, field) => {
        if (typeof value === 'string') {
          return value.trim();
        }
        return value;
      },
      
      // Handle completion
      complete: (results) => {
        // Check for parsing errors
        if (results.errors && results.errors.length > 0) {
          const firstError = results.errors[0];
          reject({
            success: false,
            error: {
              message: `CSV parsing failed at line ${firstError.row + 1}: ${firstError.message}`,
              code: firstError.code || 'PARSE_ERROR',
              row: firstError.row,
              details: firstError
            }
          });
          return;
        }

        // Check if we have data
        if (!results.data || results.data.length === 0) {
          reject({
            success: false,
            error: {
              message: 'CSV file is empty or contains no valid data',
              code: 'EMPTY_FILE'
            }
          });
          return;
        }

        // Extract headers from the first data row keys
        const headers = results.meta.fields || [];
        
        if (headers.length === 0) {
          reject({
            success: false,
            error: {
              message: 'CSV file has no headers. Please ensure the first row contains column names.',
              code: 'NO_HEADERS'
            }
          });
          return;
        }

        // Return successful parse result
        resolve({
          success: true,
          data: results.data,
          headers: headers,
          rowCount: results.data.length,
          meta: {
            delimiter: results.meta.delimiter,
            linebreak: results.meta.linebreak,
            aborted: results.meta.aborted,
            truncated: results.meta.truncated
          }
        });
      },
      
      // Handle errors
      error: (error) => {
        reject({
          success: false,
          error: {
            message: `Failed to parse CSV file: ${error.message}`,
            code: 'PARSE_ERROR',
            details: error
          }
        });
      }
    });
  });
}

/**
 * Parse CSV from a string
 * 
 * @param {string} csvString - The CSV string to parse
 * @returns {ParseResult} - Parsed data with headers and rows
 */
export function parseCSVString(csvString) {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    trimHeaders: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => {
      if (typeof value === 'string') {
        return value.trim();
      }
      return value;
    }
  });

  if (results.errors && results.errors.length > 0) {
    const firstError = results.errors[0];
    return {
      success: false,
      error: {
        message: `CSV parsing failed at line ${firstError.row + 1}: ${firstError.message}`,
        code: firstError.code || 'PARSE_ERROR',
        row: firstError.row,
        details: firstError
      }
    };
  }

  if (!results.data || results.data.length === 0) {
    return {
      success: false,
      error: {
        message: 'CSV string is empty or contains no valid data',
        code: 'EMPTY_DATA'
      }
    };
  }

  const headers = results.meta.fields || [];
  
  if (headers.length === 0) {
    return {
      success: false,
      error: {
        message: 'CSV has no headers',
        code: 'NO_HEADERS'
      }
    };
  }

  return {
    success: true,
    data: results.data,
    headers: headers,
    rowCount: results.data.length,
    meta: {
      delimiter: results.meta.delimiter,
      linebreak: results.meta.linebreak
    }
  };
}

/**
 * Validate CSV structure
 * 
 * @param {ParseResult} parseResult - The result from parseCSV
 * @param {string[]} requiredHeaders - Array of required header names
 * @returns {ValidationResult} - Validation result with errors if any
 */
export function validateCSVStructure(parseResult, requiredHeaders = []) {
  const errors = [];

  if (!parseResult.success) {
    return {
      isValid: false,
      errors: [parseResult.error]
    };
  }

  // Check for required headers
  const missingHeaders = requiredHeaders.filter(
    required => !parseResult.headers.includes(required)
  );

  if (missingHeaders.length > 0) {
    errors.push({
      message: `Missing required headers: ${missingHeaders.join(', ')}`,
      code: 'MISSING_HEADERS',
      missingHeaders
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get a preview of CSV data (first N rows)
 * 
 * @param {ParseResult} parseResult - The result from parseCSV
 * @param {number} rowCount - Number of rows to preview (default: 10)
 * @returns {Object[]} - Array of preview rows
 */
export function getCSVPreview(parseResult, rowCount = 10) {
  if (!parseResult.success || !parseResult.data) {
    return [];
  }

  return parseResult.data.slice(0, rowCount);
}
