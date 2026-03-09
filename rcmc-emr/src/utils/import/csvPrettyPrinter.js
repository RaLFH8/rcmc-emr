/**
 * CSV Pretty Printer Utility
 * 
 * Provides CSV generation functionality using papaparse library.
 * Handles structured data to CSV conversion with proper escaping and UTF-8 encoding.
 * 
 * Requirements: 14.3, 14.4, 14.5, 14.6, 14.7
 */

import Papa from 'papaparse';

/**
 * Convert structured data to CSV string
 * 
 * @param {Object[]} data - Array of objects to convert to CSV
 * @param {Object} options - Configuration options
 * @param {string[]} options.headers - Optional custom headers (defaults to object keys)
 * @param {boolean} options.includeHeaders - Whether to include headers (default: true)
 * @param {string} options.delimiter - Field delimiter (default: ',')
 * @param {string} options.newline - Line ending (default: '\r\n')
 * @returns {string} - CSV string
 */
export function printCSV(data, options = {}) {
  if (!data || !Array.isArray(data)) {
    throw new Error('Data must be an array of objects');
  }

  if (data.length === 0) {
    return '';
  }

  const {
    headers = null,
    includeHeaders = true,
    delimiter = ',',
    newline = '\r\n'
  } = options;

  // Determine headers from data if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Configure papaparse for CSV generation
  const config = {
    quotes: true,              // Quote all fields for safety
    quoteChar: '"',            // Use double quotes
    escapeChar: '"',           // Escape quotes with double quotes
    delimiter: delimiter,      // Field delimiter
    header: includeHeaders,    // Include headers in output
    newline: newline,          // Line ending
    skipEmptyLines: false,     // Keep empty lines
    columns: csvHeaders        // Specify column order
  };

  // Generate CSV string
  const csv = Papa.unparse(data, config);

  return csv;
}

/**
 * Convert structured data to CSV and download as file
 * 
 * @param {Object[]} data - Array of objects to convert to CSV
 * @param {string} filename - Name of the file to download
 * @param {Object} options - Configuration options (same as printCSV)
 */
export function downloadCSV(data, filename, options = {}) {
  const csv = printCSV(data, options);
  
  // Create blob with UTF-8 encoding
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Escape special CSV characters in a string
 * 
 * @param {string} value - The value to escape
 * @returns {string} - Escaped value
 */
export function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if value needs escaping
  const needsEscaping = 
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r');

  if (!needsEscaping) {
    return stringValue;
  }

  // Escape double quotes by doubling them
  const escaped = stringValue.replace(/"/g, '""');

  // Wrap in quotes
  return `"${escaped}"`;
}

/**
 * Convert validation errors to CSV format
 * 
 * @param {Object[]} errors - Array of validation error objects
 * @returns {string} - CSV string of errors
 */
export function printValidationErrorsCSV(errors) {
  if (!errors || errors.length === 0) {
    return '';
  }

  // Format errors for CSV export
  const formattedErrors = errors.map(error => ({
    'Row': error.row || '',
    'Field': error.field || '',
    'Value': error.value || '',
    'Error Type': error.type || '',
    'Error Message': error.message || ''
  }));

  return printCSV(formattedErrors);
}

/**
 * Convert import results to CSV format
 * 
 * @param {Object} results - Import results object
 * @returns {string} - CSV string of results
 */
export function printImportResultsCSV(results) {
  if (!results) {
    return '';
  }

  const summary = [
    {
      'Metric': 'Total Records',
      'Value': results.totalRecords || 0
    },
    {
      'Metric': 'Successfully Imported',
      'Value': results.successful || 0
    },
    {
      'Metric': 'Skipped (Duplicates)',
      'Value': results.skipped || 0
    },
    {
      'Metric': 'Failed',
      'Value': results.failed || 0
    },
    {
      'Metric': 'Duration (seconds)',
      'Value': results.duration ? (results.duration / 1000).toFixed(2) : 0
    },
    {
      'Metric': 'Import Date',
      'Value': results.timestamp ? new Date(results.timestamp).toLocaleString() : ''
    },
    {
      'Metric': 'User ID',
      'Value': results.userId || ''
    }
  ];

  // Add category breakdown if available
  if (results.categoryBreakdown) {
    Object.entries(results.categoryBreakdown).forEach(([category, count]) => {
      summary.push({
        'Metric': `Category: ${category}`,
        'Value': count
      });
    });
  }

  return printCSV(summary);
}

/**
 * Convert failed records to CSV format
 * 
 * @param {Object[]} failedRecords - Array of failed record objects
 * @returns {string} - CSV string of failed records
 */
export function printFailedRecordsCSV(failedRecords) {
  if (!failedRecords || failedRecords.length === 0) {
    return '';
  }

  // Format failed records for CSV export
  const formattedRecords = failedRecords.map(record => ({
    'Row': record.row || '',
    'Error': record.error || '',
    'Data': JSON.stringify(record.data || {})
  }));

  return printCSV(formattedRecords);
}

/**
 * Validate that CSV round-trip preserves data
 * 
 * @param {Object[]} originalData - Original data array
 * @returns {boolean} - True if round-trip preserves data
 */
export function validateRoundTrip(originalData) {
  if (!originalData || originalData.length === 0) {
    return true;
  }

  try {
    // Convert to CSV
    const csv = printCSV(originalData);

    // Parse back
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    if (!parsed.data || parsed.data.length !== originalData.length) {
      return false;
    }

    // Compare data (basic comparison)
    for (let i = 0; i < originalData.length; i++) {
      const original = originalData[i];
      const roundTrip = parsed.data[i];

      // Check if all keys match
      const originalKeys = Object.keys(original).sort();
      const roundTripKeys = Object.keys(roundTrip).sort();

      if (originalKeys.length !== roundTripKeys.length) {
        return false;
      }

      for (let j = 0; j < originalKeys.length; j++) {
        if (originalKeys[j] !== roundTripKeys[j]) {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Round-trip validation failed:', error);
    return false;
  }
}
