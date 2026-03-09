/**
 * Validation Error Reporter
 * 
 * Provides error collection, reporting, and display functionality for validation results.
 * Supports error grouping, filtering, and formatted output for user display.
 * 
 * Requirements: 5.8, 5.9, 5.10, 16.1, 16.2, 16.3, 16.4
 */

import { ValidationErrorType } from './validationEngine.js';

/**
 * Create a validation error report
 * 
 * @param {Object} validationResult - Result from validateData
 * @returns {Object} Formatted error report
 */
export function createErrorReport(validationResult) {
  const summary = {
    totalRows: validationResult.totalRows,
    validRows: validationResult.validRows,
    invalidRows: validationResult.invalidRows,
    totalErrors: validationResult.errors.length,
    errorsByType: {
      missing: validationResult.errorsByType[ValidationErrorType.MISSING].length,
      invalidType: validationResult.errorsByType[ValidationErrorType.INVALID_TYPE].length,
      outOfRange: validationResult.errorsByType[ValidationErrorType.OUT_OF_RANGE].length,
      invalidFormat: validationResult.errorsByType[ValidationErrorType.INVALID_FORMAT].length,
      custom: validationResult.errorsByType[ValidationErrorType.CUSTOM_ERROR].length
    }
  };

  const errorDetails = validationResult.errors.map(error => ({
    row: error.row,
    field: error.field,
    value: error.value,
    type: error.type,
    message: error.message
  }));

  return {
    summary,
    errors: errorDetails,
    hasErrors: validationResult.errors.length > 0
  };
}

/**
 * Group errors by row number
 * 
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Errors grouped by row number
 */
export function groupErrorsByRow(errors) {
  const grouped = {};

  errors.forEach(error => {
    if (!grouped[error.row]) {
      grouped[error.row] = [];
    }
    grouped[error.row].push(error);
  });

  return grouped;
}

/**
 * Group errors by field name
 * 
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Errors grouped by field name
 */
export function groupErrorsByField(errors) {
  const grouped = {};

  errors.forEach(error => {
    if (!grouped[error.field]) {
      grouped[error.field] = [];
    }
    grouped[error.field].push(error);
  });

  return grouped;
}

/**
 * Group errors by error type
 * 
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Errors grouped by type
 */
export function groupErrorsByType(errors) {
  const grouped = {
    [ValidationErrorType.MISSING]: [],
    [ValidationErrorType.INVALID_TYPE]: [],
    [ValidationErrorType.OUT_OF_RANGE]: [],
    [ValidationErrorType.INVALID_FORMAT]: [],
    [ValidationErrorType.CUSTOM_ERROR]: []
  };

  errors.forEach(error => {
    if (grouped[error.type]) {
      grouped[error.type].push(error);
    }
  });

  return grouped;
}

/**
 * Filter errors by row numbers
 * 
 * @param {Array} errors - Array of validation errors
 * @param {Array} rowNumbers - Array of row numbers to include
 * @returns {Array} Filtered errors
 */
export function filterErrorsByRows(errors, rowNumbers) {
  const rowSet = new Set(rowNumbers);
  return errors.filter(error => rowSet.has(error.row));
}

/**
 * Filter errors by field names
 * 
 * @param {Array} errors - Array of validation errors
 * @param {Array} fieldNames - Array of field names to include
 * @returns {Array} Filtered errors
 */
export function filterErrorsByFields(errors, fieldNames) {
  const fieldSet = new Set(fieldNames);
  return errors.filter(error => fieldSet.has(error.field));
}

/**
 * Filter errors by error type
 * 
 * @param {Array} errors - Array of validation errors
 * @param {string} errorType - Error type to filter by
 * @returns {Array} Filtered errors
 */
export function filterErrorsByType(errors, errorType) {
  return errors.filter(error => error.type === errorType);
}

/**
 * Format error summary for display
 * 
 * @param {Object} errorReport - Error report from createErrorReport
 * @returns {string} Formatted summary text
 */
export function formatErrorSummary(errorReport) {
  if (!errorReport.hasErrors) {
    return 'All rows passed validation ✓';
  }

  const { summary } = errorReport;
  
  const lines = [
    `Validation Summary:`,
    `  Total Rows: ${summary.totalRows}`,
    `  Valid Rows: ${summary.validRows}`,
    `  Invalid Rows: ${summary.invalidRows}`,
    `  Total Errors: ${summary.totalErrors}`,
    ``,
    `Errors by Type:`,
    `  Missing Fields: ${summary.errorsByType.missing}`,
    `  Invalid Types: ${summary.errorsByType.invalidType}`,
    `  Out of Range: ${summary.errorsByType.outOfRange}`,
    `  Invalid Formats: ${summary.errorsByType.invalidFormat}`,
    `  Custom Errors: ${summary.errorsByType.custom}`
  ];

  return lines.join('\n');
}

/**
 * Format error details for display
 * 
 * @param {Array} errors - Array of validation errors
 * @param {number} maxErrors - Maximum number of errors to display (default: 50)
 * @returns {string} Formatted error details
 */
export function formatErrorDetails(errors, maxErrors = 50) {
  if (errors.length === 0) {
    return 'No errors to display';
  }

  const displayErrors = errors.slice(0, maxErrors);
  const lines = displayErrors.map(error => 
    `Row ${error.row}, Field "${error.field}": ${error.message}`
  );

  if (errors.length > maxErrors) {
    lines.push(`... and ${errors.length - maxErrors} more errors`);
  }

  return lines.join('\n');
}

/**
 * Format errors grouped by row
 * 
 * @param {Object} groupedErrors - Errors grouped by row (from groupErrorsByRow)
 * @param {number} maxRows - Maximum number of rows to display (default: 20)
 * @returns {string} Formatted grouped errors
 */
export function formatErrorsByRow(groupedErrors, maxRows = 20) {
  const rows = Object.keys(groupedErrors).sort((a, b) => parseInt(a) - parseInt(b));
  const displayRows = rows.slice(0, maxRows);

  const lines = [];
  displayRows.forEach(row => {
    lines.push(`Row ${row}:`);
    groupedErrors[row].forEach(error => {
      lines.push(`  - ${error.field}: ${error.message}`);
    });
  });

  if (rows.length > maxRows) {
    lines.push(`... and ${rows.length - maxRows} more rows with errors`);
  }

  return lines.join('\n');
}

/**
 * Get error type label for display
 * 
 * @param {string} errorType - Error type constant
 * @returns {string} Human-readable label
 */
export function getErrorTypeLabel(errorType) {
  const labels = {
    [ValidationErrorType.MISSING]: 'Missing Field',
    [ValidationErrorType.INVALID_TYPE]: 'Invalid Type',
    [ValidationErrorType.OUT_OF_RANGE]: 'Out of Range',
    [ValidationErrorType.INVALID_FORMAT]: 'Invalid Format',
    [ValidationErrorType.CUSTOM_ERROR]: 'Validation Error'
  };

  return labels[errorType] || 'Unknown Error';
}

/**
 * Get error type color for UI display
 * 
 * @param {string} errorType - Error type constant
 * @returns {string} Tailwind CSS color class
 */
export function getErrorTypeColor(errorType) {
  const colors = {
    [ValidationErrorType.MISSING]: 'text-red-600',
    [ValidationErrorType.INVALID_TYPE]: 'text-orange-600',
    [ValidationErrorType.OUT_OF_RANGE]: 'text-yellow-600',
    [ValidationErrorType.INVALID_FORMAT]: 'text-purple-600',
    [ValidationErrorType.CUSTOM_ERROR]: 'text-blue-600'
  };

  return colors[errorType] || 'text-gray-600';
}

/**
 * Get error type icon for UI display
 * 
 * @param {string} errorType - Error type constant
 * @returns {string} Icon name or emoji
 */
export function getErrorTypeIcon(errorType) {
  const icons = {
    [ValidationErrorType.MISSING]: '⚠️',
    [ValidationErrorType.INVALID_TYPE]: '🔤',
    [ValidationErrorType.OUT_OF_RANGE]: '📊',
    [ValidationErrorType.INVALID_FORMAT]: '📝',
    [ValidationErrorType.CUSTOM_ERROR]: '❌'
  };

  return icons[errorType] || '❓';
}

/**
 * Create actionable guidance for common errors
 * 
 * @param {string} errorType - Error type constant
 * @param {string} field - Field name
 * @returns {string} Guidance message
 */
export function getErrorGuidance(errorType, field) {
  switch (errorType) {
    case ValidationErrorType.MISSING:
      return `Ensure all rows have a value for "${field}". Empty cells are not allowed for required fields.`;
    
    case ValidationErrorType.INVALID_TYPE:
      return `Check that "${field}" contains the correct data type. Numbers should not have text, dates should be in YYYY-MM-DD format.`;
    
    case ValidationErrorType.OUT_OF_RANGE:
      return `Verify that "${field}" values are within the acceptable range. Check for negative numbers or unrealistic values.`;
    
    case ValidationErrorType.INVALID_FORMAT:
      return `Ensure "${field}" follows the required format. Check for typos or incorrect patterns.`;
    
    case ValidationErrorType.CUSTOM_ERROR:
      return `Review the specific validation requirements for "${field}" and correct the data accordingly.`;
    
    default:
      return 'Please review and correct the data before importing.';
  }
}

/**
 * Create a user-friendly error message
 * 
 * @param {Object} error - Validation error object
 * @returns {string} User-friendly message
 */
export function createUserFriendlyMessage(error) {
  const typeLabel = getErrorTypeLabel(error.type);
  const icon = getErrorTypeIcon(error.type);
  
  return `${icon} ${typeLabel} - Row ${error.row}: ${error.message}`;
}

/**
 * Check if errors can be auto-fixed
 * 
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Auto-fix analysis
 */
export function analyzeAutoFixPotential(errors) {
  const fixable = [];
  const notFixable = [];

  errors.forEach(error => {
    // Some errors might be auto-fixable (e.g., trimming whitespace, formatting)
    // For now, we'll mark format errors as potentially fixable
    if (error.type === ValidationErrorType.INVALID_FORMAT) {
      fixable.push(error);
    } else {
      notFixable.push(error);
    }
  });

  return {
    fixableCount: fixable.length,
    notFixableCount: notFixable.length,
    fixableErrors: fixable,
    notFixableErrors: notFixable,
    canAutoFix: fixable.length > 0
  };
}
