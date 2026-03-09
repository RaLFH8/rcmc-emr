/**
 * Error Message Formatter
 * 
 * Converts technical errors to user-friendly messages with actionable guidance.
 * Provides specific error messages for each invalid row with clear instructions.
 * 
 * Requirements: 16.1, 16.2, 16.3
 */

/**
 * Common error types and their user-friendly messages
 */
export const ErrorMessages = {
  // Missing field errors
  MISSING_REQUIRED_FIELD: (row, field) => 
    `Row ${row}: Missing required field '${field}'. Please provide a value.`,
  
  // Invalid data type errors
  INVALID_DATA_TYPE: (row, field, expectedType, value, example) => 
    `Row ${row}: Invalid ${field}. Expected ${expectedType}, got '${value}'. Example: ${example}`,
  
  // Out of range errors
  OUT_OF_RANGE: (row, field, value, min, max) => 
    `Row ${row}: ${field} value '${value}' is out of range. Must be between ${min} and ${max}.`,
  
  // Invalid format errors
  INVALID_FORMAT: (row, field, value, format, example) => 
    `Row ${row}: Invalid ${field} format '${value}'. Expected format: ${format}. Example: ${example}`,
  
  // Doctor not found
  DOCTOR_NOT_FOUND: (row, doctorName) => 
    `Row ${row}: Doctor '${doctorName}' not found. Please check the spelling or add the doctor to the system first.`,
  
  // Duplicate record
  DUPLICATE_RECORD: (row, matchFields) => 
    `Row ${row}: Duplicate record found. A record with the same ${matchFields} already exists.`,
  
  // Network errors
  NETWORK_ERROR: () => 
    'Network error occurred. Please check your connection and try again.',
  
  // Database errors
  DATABASE_ERROR: () => 
    'Database error occurred. Please contact support if the problem persists.',
  
  // File errors
  FILE_TOO_LARGE: (maxSize) => 
    `File size exceeds ${maxSize}MB limit. Please reduce file size and try again.`,
  
  INVALID_FILE_TYPE: (allowedTypes) => 
    `Invalid file type. Please upload one of: ${allowedTypes.join(', ')}`,
  
  // Parsing errors
  CSV_PARSE_ERROR: (lineNumber, message) => 
    `CSV parsing failed at line ${lineNumber}: ${message}`,
  
  MISSING_HEADERS: (requiredHeaders) => 
    `Missing required columns: ${requiredHeaders.join(', ')}. Please check your CSV file.`,
  
  // Age/Sex format errors
  INVALID_AGE_SEX_FORMAT: (row, value) => 
    `Row ${row}: Invalid Age/Sex format '${value}'. Expected format: '25/M' or '30/F'.`,
  
  // Date format errors
  INVALID_DATE_FORMAT: (row, field, value) => 
    `Row ${row}: Invalid ${field} date '${value}'. Expected format: YYYY-MM-DD (e.g., 2024-01-15).`,
  
  // Price/amount errors
  INVALID_PRICE: (row, value) => 
    `Row ${row}: Invalid price '${value}'. Price must be a positive number.`,
  
  INVALID_DISCOUNT: (row, value) => 
    `Row ${row}: Invalid discount '${value}'. Use percentage (e.g., '10%') or fixed amount (e.g., '50').`,
  
  // Item categorization errors
  AMBIGUOUS_CATEGORY: (row, itemName) => 
    `Row ${row}: Unable to categorize item '${itemName}'. Please review and manually categorize if needed.`,
  
  // Service code errors
  DUPLICATE_SERVICE_CODE: (row, code) => 
    `Row ${row}: Service code '${code}' already exists. Codes must be unique.`,
  
  // Transaction errors
  TRANSACTION_FAILED: (reason) => 
    `Import failed: ${reason}. All changes have been rolled back.`,
  
  ROLLBACK_COMPLETE: () => 
    'Import cancelled. No changes were made to the database.',
};

/**
 * Format a validation error into a user-friendly message
 * 
 * @param {Object} error - Validation error object
 * @returns {string} User-friendly error message
 */
export function formatValidationError(error) {
  const { row, field, value, type, message } = error;
  
  // If error already has a user-friendly message, use it
  if (message && !message.includes('undefined') && !message.includes('null')) {
    return message;
  }
  
  // Generate user-friendly message based on error type
  switch (type) {
    case 'missing':
      return ErrorMessages.MISSING_REQUIRED_FIELD(row, field);
    
    case 'invalid_type':
      return formatInvalidTypeError(row, field, value);
    
    case 'out_of_range':
      return formatOutOfRangeError(row, field, value);
    
    case 'invalid_format':
      return formatInvalidFormatError(row, field, value);
    
    default:
      return `Row ${row}: ${message || 'Validation error in field ' + field}`;
  }
}

/**
 * Format invalid type error with specific guidance
 */
function formatInvalidTypeError(row, field, value) {
  const fieldGuidance = {
    'age': { type: 'number', example: '25' },
    'price': { type: 'number', example: '150.00' },
    'stock': { type: 'number', example: '100' },
    'discount': { type: 'number or percentage', example: '10% or 50' },
    'payment': { type: 'number', example: '500.00' },
    'consultation_date': { type: 'date', example: '2024-01-15' },
    'date_of_birth': { type: 'date', example: '1990-05-20' },
  };
  
  const guidance = fieldGuidance[field.toLowerCase()] || { type: 'valid value', example: 'see documentation' };
  return ErrorMessages.INVALID_DATA_TYPE(row, field, guidance.type, value, guidance.example);
}

/**
 * Format out of range error with specific limits
 */
function formatOutOfRangeError(row, field, value) {
  const fieldRanges = {
    'age': { min: 0, max: 150 },
    'price': { min: 0.01, max: 1000000 },
    'stock': { min: 0, max: 100000 },
    'discount': { min: 0, max: 100 },
  };
  
  const range = fieldRanges[field.toLowerCase()] || { min: 'minimum', max: 'maximum' };
  return ErrorMessages.OUT_OF_RANGE(row, field, value, range.min, range.max);
}

/**
 * Format invalid format error with expected format
 */
function formatInvalidFormatError(row, field, value) {
  const fieldFormats = {
    'age_sex': { format: '[number]/[M|F]', example: '25/M or 30/F' },
    'phone': { format: '10-11 digits', example: '09171234567' },
    'email': { format: 'valid email address', example: 'user@example.com' },
    'consultation_date': { format: 'YYYY-MM-DD', example: '2024-01-15' },
    'date_of_birth': { format: 'YYYY-MM-DD', example: '1990-05-20' },
  };
  
  const format = fieldFormats[field.toLowerCase()] || { format: 'valid format', example: 'see documentation' };
  return ErrorMessages.INVALID_FORMAT(row, field, value, format.format, format.example);
}

/**
 * Get actionable guidance for an error type
 * 
 * @param {string} errorType - Type of error
 * @param {string} field - Field name
 * @returns {string} Actionable guidance message
 */
export function getActionableGuidance(errorType, field) {
  const guidance = {
    'missing': {
      'patient_name': 'Ensure every row has a patient name. Empty cells are not allowed.',
      'doctor': 'Each consultation must have a doctor assigned. Check for empty doctor cells.',
      'age_sex': 'Age/Sex is required for all patients. Use format: "25/M" or "30/F".',
      'consultation_date': 'Every consultation must have a date. Use format: YYYY-MM-DD.',
      'item_name': 'All inventory items must have a name. Check for empty name cells.',
      'price': 'Price is required for all items. Enter a positive number.',
      'test_name': 'All lab tests must have a name. Check for empty name cells.',
      'default': `Ensure all rows have a value for "${field}". Empty cells are not allowed for required fields.`
    },
    'invalid_type': {
      'age': 'Age must be a number. Remove any text or special characters.',
      'price': 'Price must be a number. Remove currency symbols and use decimal point (e.g., 150.00).',
      'stock': 'Stock must be a whole number. Remove decimals and text.',
      'discount': 'Discount must be a number or percentage (e.g., 10% or 50).',
      'payment': 'Payment must be a number. Remove currency symbols.',
      'default': `Check that "${field}" contains the correct data type. Numbers should not have text, dates should be in YYYY-MM-DD format.`
    },
    'out_of_range': {
      'age': 'Age must be between 0 and 150. Check for typos or unrealistic values.',
      'price': 'Price must be greater than 0. Check for negative values or zeros.',
      'stock': 'Stock must be 0 or greater. Negative stock is not allowed.',
      'discount': 'Discount must be between 0 and 100 for percentages, or a positive amount for fixed discounts.',
      'default': `Verify that "${field}" values are within the acceptable range. Check for negative numbers or unrealistic values.`
    },
    'invalid_format': {
      'age_sex': 'Use format: [number]/[M|F]. Examples: "25/M", "30/F". Include the slash and gender letter.',
      'phone': 'Phone numbers should be 10-11 digits. Remove spaces, dashes, and country codes.',
      'email': 'Email must be in format: user@domain.com. Check for typos.',
      'consultation_date': 'Dates must be in format: YYYY-MM-DD. Example: 2024-01-15.',
      'date_of_birth': 'Birth dates must be in format: YYYY-MM-DD. Example: 1990-05-20.',
      'default': `Ensure "${field}" follows the required format. Check for typos or incorrect patterns.`
    },
    'custom': {
      'doctor': 'Doctor name must match an existing doctor in the system. Check spelling and ensure the doctor is added to the system first.',
      'duplicate': 'This record appears to be a duplicate. Review the data and decide whether to skip, update, or create a new record.',
      'default': `Review the specific validation requirements for "${field}" and correct the data accordingly.`
    }
  };
  
  const typeGuidance = guidance[errorType] || guidance['custom'];
  return typeGuidance[field.toLowerCase()] || typeGuidance['default'];
}

/**
 * Group errors by type and provide summary guidance
 * 
 * @param {Array} errors - Array of validation errors
 * @returns {Object} Grouped errors with guidance
 */
export function groupErrorsWithGuidance(errors) {
  const grouped = {
    missing: [],
    invalid_type: [],
    out_of_range: [],
    invalid_format: [],
    custom: []
  };
  
  errors.forEach(error => {
    const type = error.type || 'custom';
    if (grouped[type]) {
      grouped[type].push({
        ...error,
        userMessage: formatValidationError(error),
        guidance: getActionableGuidance(type, error.field)
      });
    }
  });
  
  return {
    missing: {
      count: grouped.missing.length,
      errors: grouped.missing,
      summary: 'Missing required fields. Fill in all required data before importing.'
    },
    invalid_type: {
      count: grouped.invalid_type.length,
      errors: grouped.invalid_type,
      summary: 'Invalid data types. Ensure numbers are numeric, dates are properly formatted.'
    },
    out_of_range: {
      count: grouped.out_of_range.length,
      errors: grouped.out_of_range,
      summary: 'Values out of acceptable range. Check for negative numbers or unrealistic values.'
    },
    invalid_format: {
      count: grouped.invalid_format.length,
      errors: grouped.invalid_format,
      summary: 'Invalid formats. Follow the required patterns for each field.'
    },
    custom: {
      count: grouped.custom.length,
      errors: grouped.custom,
      summary: 'Custom validation errors. Review specific requirements for each field.'
    }
  };
}

/**
 * Format database error into user-friendly message
 * 
 * @param {Error} error - Database error object
 * @returns {string} User-friendly error message
 */
export function formatDatabaseError(error) {
  const errorMessage = error.message || error.toString();
  
  // Check for common database errors
  if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
    return 'A record with this information already exists. Please check for duplicates.';
  }
  
  if (errorMessage.includes('foreign key') || errorMessage.includes('violates foreign key constraint')) {
    return 'Referenced record not found. Ensure all related records (doctors, patients) exist in the system.';
  }
  
  if (errorMessage.includes('not null constraint') || errorMessage.includes('null value')) {
    return 'Required field is missing. Please ensure all required fields have values.';
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
    return ErrorMessages.NETWORK_ERROR();
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('access denied')) {
    return 'Permission denied. You do not have access to perform this operation.';
  }
  
  // Generic database error
  return ErrorMessages.DATABASE_ERROR();
}

/**
 * Format network error into user-friendly message
 * 
 * @param {Error} error - Network error object
 * @returns {string} User-friendly error message
 */
export function formatNetworkError(error) {
  const errorMessage = error.message || error.toString();
  
  if (errorMessage.includes('timeout')) {
    return 'Request timed out. Please check your internet connection and try again.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return ErrorMessages.NETWORK_ERROR();
  }
  
  if (errorMessage.includes('offline')) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  
  return ErrorMessages.NETWORK_ERROR();
}

/**
 * Determine if an error is retryable
 * 
 * @param {Error} error - Error object
 * @returns {boolean} True if error is retryable
 */
export function isRetryableError(error) {
  const errorMessage = error.message || error.toString();
  
  // Network errors are retryable
  if (errorMessage.includes('network') || 
      errorMessage.includes('timeout') || 
      errorMessage.includes('fetch') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('connection')) {
    return true;
  }
  
  // Temporary database errors are retryable
  if (errorMessage.includes('temporary') || 
      errorMessage.includes('retry') ||
      errorMessage.includes('busy')) {
    return true;
  }
  
  // Validation errors are not retryable (need data fix)
  if (errorMessage.includes('validation') || 
      errorMessage.includes('invalid') ||
      errorMessage.includes('constraint')) {
    return false;
  }
  
  return false;
}

/**
 * Create error summary for display
 * 
 * @param {Array} errors - Array of errors
 * @returns {Object} Error summary
 */
export function createErrorSummary(errors) {
  const grouped = groupErrorsWithGuidance(errors);
  
  const totalErrors = errors.length;
  const errorTypes = Object.keys(grouped).filter(key => grouped[key].count > 0);
  
  return {
    totalErrors,
    errorTypes,
    grouped,
    hasErrors: totalErrors > 0,
    mostCommonType: errorTypes.reduce((max, type) => 
      grouped[type].count > (grouped[max]?.count || 0) ? type : max, 
      errorTypes[0]
    ),
    summary: `Found ${totalErrors} error(s) across ${errorTypes.length} type(s). ${
      totalErrors > 0 ? 'Please fix these errors before importing.' : 'All data is valid.'
    }`
  };
}

/**
 * Format error for CSV export
 * 
 * @param {Object} error - Error object
 * @returns {Object} Formatted error for CSV
 */
export function formatErrorForExport(error) {
  return {
    'Row': error.row,
    'Field': error.field,
    'Value': error.value || '',
    'Error Type': error.type,
    'Error Message': formatValidationError(error),
    'Suggested Fix': getActionableGuidance(error.type, error.field)
  };
}

/**
 * Create downloadable error report
 * 
 * @param {Array} errors - Array of errors
 * @returns {Array} Formatted errors for CSV export
 */
export function createErrorReport(errors) {
  return errors.map(formatErrorForExport);
}
