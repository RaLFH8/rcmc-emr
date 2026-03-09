/**
 * Validation Error CSV Export
 * 
 * Provides functionality to export validation errors to CSV format for download and review.
 * Supports error reports with row numbers, field names, values, and error messages.
 * Includes actionable guidance for fixing errors.
 * 
 * Requirements: 5.11, 16.4, 16.5
 */

import { printCSV } from './csvPrettyPrinter.js';
import { getErrorTypeLabel } from './validationReporter.js';
import { formatValidationError, getActionableGuidance } from './errorMessageFormatter.js';

/**
 * Export validation errors to CSV format with actionable guidance
 * 
 * @param {Array} errors - Array of validation errors
 * @returns {string} CSV string with error details and suggested fixes
 */
export function exportErrorsToCSV(errors) {
  if (!errors || errors.length === 0) {
    return 'Row,Field,Value,Error Type,Error Message,Suggested Fix\n';
  }

  const errorData = errors.map(error => ({
    Row: error.row,
    Field: error.field,
    Value: formatValueForCSV(error.value),
    'Error Type': getErrorTypeLabel(error.type),
    'Error Message': formatValidationError(error),
    'Suggested Fix': getActionableGuidance(error.type, error.field)
  }));

  return printCSV(errorData);
}

/**
 * Export validation error report with summary
 * 
 * @param {Object} errorReport - Error report from createErrorReport
 * @returns {string} CSV string with summary and errors
 */
export function exportErrorReportToCSV(errorReport) {
  if (!errorReport.hasErrors) {
    return 'Status,Message\nSuccess,All rows passed validation\n';
  }

  const { summary, errors } = errorReport;

  // Create summary section
  const summaryData = [
    { Metric: 'Total Rows', Value: summary.totalRows },
    { Metric: 'Valid Rows', Value: summary.validRows },
    { Metric: 'Invalid Rows', Value: summary.invalidRows },
    { Metric: 'Total Errors', Value: summary.totalErrors },
    { Metric: '', Value: '' }, // Empty row separator
    { Metric: 'Missing Fields', Value: summary.errorsByType.missing },
    { Metric: 'Invalid Types', Value: summary.errorsByType.invalidType },
    { Metric: 'Out of Range', Value: summary.errorsByType.outOfRange },
    { Metric: 'Invalid Formats', Value: summary.errorsByType.invalidFormat },
    { Metric: 'Custom Errors', Value: summary.errorsByType.custom }
  ];

  const summaryCSV = printCSV(summaryData);

  // Create errors section
  const errorsCSV = exportErrorsToCSV(errors);

  // Combine with separator
  return `${summaryCSV}\n\n${errorsCSV}`;
}

/**
 * Export invalid rows with their errors and suggested fixes
 * 
 * @param {Array} invalidData - Invalid rows from validation result
 * @param {Array} originalHeaders - Original CSV headers
 * @returns {string} CSV string with invalid rows and error annotations
 */
export function exportInvalidRowsToCSV(invalidData, originalHeaders) {
  if (!invalidData || invalidData.length === 0) {
    return '';
  }

  const exportData = invalidData.map(row => {
    const rowData = {};
    
    // Add row number
    rowData['Row Number'] = row._rowIndex;
    
    // Add original data fields
    originalHeaders.forEach(header => {
      rowData[header] = formatValueForCSV(row[header]);
    });
    
    // Add error summary with user-friendly messages
    if (row._errors && row._errors.length > 0) {
      const errorMessages = row._errors.map(e => formatValidationError(e)).join('; ');
      rowData['Errors'] = errorMessages;
      
      // Add suggested fixes
      const fixes = row._errors.map(e => getActionableGuidance(e.type, e.field)).join('; ');
      rowData['Suggested Fixes'] = fixes;
    }
    
    return rowData;
  });

  return printCSV(exportData);
}

/**
 * Export errors grouped by row with user-friendly messages
 * 
 * @param {Object} groupedErrors - Errors grouped by row number
 * @returns {string} CSV string with grouped errors
 */
export function exportGroupedErrorsToCSV(groupedErrors) {
  const exportData = [];

  Object.keys(groupedErrors).sort((a, b) => parseInt(a) - parseInt(b)).forEach(row => {
    const errors = groupedErrors[row];
    
    errors.forEach((error, index) => {
      exportData.push({
        Row: row,
        'Error Number': index + 1,
        Field: error.field,
        Value: formatValueForCSV(error.value),
        'Error Type': getErrorTypeLabel(error.type),
        'Error Message': formatValidationError(error),
        'Suggested Fix': getActionableGuidance(error.type, error.field)
      });
    });
  });

  return printCSV(exportData);
}

/**
 * Export errors grouped by field with user-friendly messages
 * 
 * @param {Object} groupedErrors - Errors grouped by field name
 * @returns {string} CSV string with field-grouped errors
 */
export function exportFieldGroupedErrorsToCSV(groupedErrors) {
  const exportData = [];

  Object.keys(groupedErrors).sort().forEach(field => {
    const errors = groupedErrors[field];
    
    errors.forEach((error, index) => {
      exportData.push({
        Field: field,
        'Error Number': index + 1,
        Row: error.row,
        Value: formatValueForCSV(error.value),
        'Error Type': getErrorTypeLabel(error.type),
        'Error Message': formatValidationError(error),
        'Suggested Fix': getActionableGuidance(error.type, error.field)
      });
    });
  });

  return printCSV(exportData);
}

/**
 * Create downloadable CSV file from error data
 * 
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Filename for download
 * @returns {Object} Blob and download URL
 */
export function createErrorCSVDownload(csvContent, filename = 'validation-errors.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  return {
    blob,
    url,
    filename,
    download: () => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
}

/**
 * Download validation errors as CSV file
 * 
 * @param {Array} errors - Array of validation errors
 * @param {string} filename - Optional filename
 */
export function downloadErrorsCSV(errors, filename = 'validation-errors.csv') {
  const csvContent = exportErrorsToCSV(errors);
  const download = createErrorCSVDownload(csvContent, filename);
  download.download();
}

/**
 * Download error report as CSV file
 * 
 * @param {Object} errorReport - Error report from createErrorReport
 * @param {string} filename - Optional filename
 */
export function downloadErrorReportCSV(errorReport, filename = 'validation-report.csv') {
  const csvContent = exportErrorReportToCSV(errorReport);
  const download = createErrorCSVDownload(csvContent, filename);
  download.download();
}

/**
 * Download invalid rows as CSV file
 * 
 * @param {Array} invalidData - Invalid rows from validation result
 * @param {Array} originalHeaders - Original CSV headers
 * @param {string} filename - Optional filename
 */
export function downloadInvalidRowsCSV(invalidData, originalHeaders, filename = 'invalid-rows.csv') {
  const csvContent = exportInvalidRowsToCSV(invalidData, originalHeaders);
  const download = createErrorCSVDownload(csvContent, filename);
  download.download();
}

/**
 * Format value for CSV export (handle null, undefined, objects)
 * 
 * @param {*} value - Value to format
 * @returns {string} Formatted value
 */
function formatValueForCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Generate timestamped filename for error export
 * 
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension (default: 'csv')
 * @returns {string} Timestamped filename
 */
export function generateErrorFilename(prefix = 'validation-errors', extension = 'csv') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Export validation summary statistics
 * 
 * @param {Object} errorReport - Error report from createErrorReport
 * @returns {string} CSV string with summary statistics
 */
export function exportSummaryStatistics(errorReport) {
  const { summary } = errorReport;
  
  const stats = [
    { Category: 'Overview', Metric: 'Total Rows', Value: summary.totalRows },
    { Category: 'Overview', Metric: 'Valid Rows', Value: summary.validRows },
    { Category: 'Overview', Metric: 'Invalid Rows', Value: summary.invalidRows },
    { Category: 'Overview', Metric: 'Total Errors', Value: summary.totalErrors },
    { Category: 'Overview', Metric: 'Validation Pass Rate', Value: `${((summary.validRows / summary.totalRows) * 100).toFixed(2)}%` },
    { Category: 'Error Types', Metric: 'Missing Fields', Value: summary.errorsByType.missing },
    { Category: 'Error Types', Metric: 'Invalid Types', Value: summary.errorsByType.invalidType },
    { Category: 'Error Types', Metric: 'Out of Range', Value: summary.errorsByType.outOfRange },
    { Category: 'Error Types', Metric: 'Invalid Formats', Value: summary.errorsByType.invalidFormat },
    { Category: 'Error Types', Metric: 'Custom Errors', Value: summary.errorsByType.custom }
  ];

  return printCSV(stats);
}
