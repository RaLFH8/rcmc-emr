/**
 * Validation Engine
 * 
 * Provides comprehensive validation for imported data against business rules and data types.
 * Supports required fields, type checking, range validation, format patterns, and custom validators.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11
 */

/**
 * Validation rule types
 */
export const ValidationRuleType = {
  REQUIRED: 'required',
  TYPE: 'type',
  RANGE: 'range',
  FORMAT: 'format',
  CUSTOM: 'custom'
};

/**
 * Validation error types
 */
export const ValidationErrorType = {
  MISSING: 'missing',
  INVALID_TYPE: 'invalid_type',
  OUT_OF_RANGE: 'out_of_range',
  INVALID_FORMAT: 'invalid_format',
  CUSTOM_ERROR: 'custom_error'
};

/**
 * Data types for validation
 */
export const DataType = {
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  DECIMAL: 'decimal',
  DATE: 'date',
  BOOLEAN: 'boolean',
  EMAIL: 'email',
  PHONE: 'phone'
};

/**
 * Create a validation rule
 * 
 * @param {string} field - Field name to validate
 * @param {string} type - Rule type (required, type, range, format, custom)
 * @param {Function} validator - Validation function
 * @param {string} message - Error message template
 * @param {Object} options - Additional options for the rule
 * @returns {Object} Validation rule
 */
export function createValidationRule(field, type, validator, message, options = {}) {
  return {
    field,
    type,
    validator,
    message,
    options
  };
}

/**
 * Create a required field rule
 * 
 * @param {string} field - Field name
 * @param {string} customMessage - Optional custom error message
 * @returns {Object} Validation rule
 */
export function requiredField(field, customMessage = null) {
  return createValidationRule(
    field,
    ValidationRuleType.REQUIRED,
    (value) => {
      return value !== null && value !== undefined && value !== '';
    },
    customMessage || `Missing required field: ${field}`
  );
}

/**
 * Create a type validation rule
 * 
 * @param {string} field - Field name
 * @param {string} dataType - Expected data type
 * @param {string} customMessage - Optional custom error message
 * @returns {Object} Validation rule
 */
export function typeValidation(field, dataType, customMessage = null) {
  return createValidationRule(
    field,
    ValidationRuleType.TYPE,
    (value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Skip type check for empty values (use required rule separately)
      }

      switch (dataType) {
        case DataType.STRING:
          return typeof value === 'string';
        
        case DataType.NUMBER:
        case DataType.DECIMAL:
          return typeof value === 'number' && !isNaN(value);
        
        case DataType.INTEGER:
          return typeof value === 'number' && Number.isInteger(value);
        
        case DataType.DATE:
          if (typeof value === 'string') {
            const date = new Date(value);
            return !isNaN(date.getTime());
          }
          return value instanceof Date && !isNaN(value.getTime());
        
        case DataType.BOOLEAN:
          return typeof value === 'boolean';
        
        case DataType.EMAIL:
          if (typeof value !== 'string') return false;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        
        case DataType.PHONE:
          if (typeof value !== 'string') return false;
          // Philippine phone number format (flexible)
          const phoneRegex = /^(\+63|0)?[0-9]{10}$/;
          return phoneRegex.test(value.replace(/[\s\-()]/g, ''));
        
        default:
          return true;
      }
    },
    customMessage || `Invalid ${field}: expected ${dataType}, got {value}`,
    { dataType }
  );
}

/**
 * Create a range validation rule
 * 
 * @param {string} field - Field name
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @param {string} customMessage - Optional custom error message
 * @returns {Object} Validation rule
 */
export function rangeValidation(field, min, max, customMessage = null) {
  return createValidationRule(
    field,
    ValidationRuleType.RANGE,
    (value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Skip range check for empty values
      }

      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(numValue)) return false;

      return numValue >= min && numValue <= max;
    },
    customMessage || `${field} out of range: {value} (must be between ${min} and ${max})`,
    { min, max }
  );
}

/**
 * Create a format pattern validation rule
 * 
 * @param {string} field - Field name
 * @param {RegExp} pattern - Regular expression pattern
 * @param {string} patternDescription - Human-readable pattern description
 * @param {string} customMessage - Optional custom error message
 * @returns {Object} Validation rule
 */
export function formatValidation(field, pattern, patternDescription, customMessage = null) {
  return createValidationRule(
    field,
    ValidationRuleType.FORMAT,
    (value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Skip format check for empty values
      }

      const strValue = String(value);
      return pattern.test(strValue);
    },
    customMessage || `Invalid ${field} format: expected ${patternDescription}, got {value}`,
    { pattern, patternDescription }
  );
}

/**
 * Create a custom validation rule
 * 
 * @param {string} field - Field name
 * @param {Function} validator - Custom validation function (value, row) => boolean
 * @param {string} message - Error message
 * @returns {Object} Validation rule
 */
export function customValidation(field, validator, message) {
  return createValidationRule(
    field,
    ValidationRuleType.CUSTOM,
    validator,
    message
  );
}

/**
 * Validate a single row against validation rules
 * 
 * @param {Object} row - Data row to validate
 * @param {number} rowIndex - Row index (for error reporting)
 * @param {Array} rules - Array of validation rules
 * @returns {Object} Validation result with errors
 */
export function validateRow(row, rowIndex, rules) {
  const errors = [];

  for (const rule of rules) {
    const value = row[rule.field];
    const isValid = rule.validator(value, row);

    if (!isValid) {
      const errorMessage = rule.message.replace('{value}', String(value));
      
      let errorType;
      switch (rule.type) {
        case ValidationRuleType.REQUIRED:
          errorType = ValidationErrorType.MISSING;
          break;
        case ValidationRuleType.TYPE:
          errorType = ValidationErrorType.INVALID_TYPE;
          break;
        case ValidationRuleType.RANGE:
          errorType = ValidationErrorType.OUT_OF_RANGE;
          break;
        case ValidationRuleType.FORMAT:
          errorType = ValidationErrorType.INVALID_FORMAT;
          break;
        default:
          errorType = ValidationErrorType.CUSTOM_ERROR;
      }

      errors.push({
        row: rowIndex,
        field: rule.field,
        value: value,
        message: errorMessage,
        type: errorType
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate all rows in a dataset
 * 
 * @param {Array} data - Array of data rows
 * @param {Array} rules - Array of validation rules
 * @returns {Object} Validation result with all errors
 */
export function validateData(data, rules) {
  const allErrors = [];
  const validRows = [];
  const invalidRows = [];

  data.forEach((row, index) => {
    const result = validateRow(row, index + 1, rules); // 1-indexed for user display
    
    if (result.isValid) {
      validRows.push({ ...row, _rowIndex: index + 1 });
    } else {
      invalidRows.push({ ...row, _rowIndex: index + 1, _errors: result.errors });
      allErrors.push(...result.errors);
    }
  });

  // Group errors by type
  const errorsByType = {
    [ValidationErrorType.MISSING]: [],
    [ValidationErrorType.INVALID_TYPE]: [],
    [ValidationErrorType.OUT_OF_RANGE]: [],
    [ValidationErrorType.INVALID_FORMAT]: [],
    [ValidationErrorType.CUSTOM_ERROR]: []
  };

  allErrors.forEach(error => {
    errorsByType[error.type].push(error);
  });

  return {
    isValid: allErrors.length === 0,
    totalRows: data.length,
    validRows: validRows.length,
    invalidRows: invalidRows.length,
    errors: allErrors,
    errorsByType,
    validData: validRows,
    invalidData: invalidRows
  };
}

/**
 * Get error summary statistics
 * 
 * @param {Object} validationResult - Result from validateData
 * @returns {Object} Error summary with counts by type
 */
export function getErrorSummary(validationResult) {
  return {
    totalErrors: validationResult.errors.length,
    missingFields: validationResult.errorsByType[ValidationErrorType.MISSING].length,
    invalidTypes: validationResult.errorsByType[ValidationErrorType.INVALID_TYPE].length,
    outOfRange: validationResult.errorsByType[ValidationErrorType.OUT_OF_RANGE].length,
    invalidFormats: validationResult.errorsByType[ValidationErrorType.INVALID_FORMAT].length,
    customErrors: validationResult.errorsByType[ValidationErrorType.CUSTOM_ERROR].length
  };
}

/**
 * Format validation errors for display
 * 
 * @param {Array} errors - Array of validation errors
 * @returns {string} Formatted error message
 */
export function formatValidationErrors(errors) {
  if (errors.length === 0) {
    return 'No validation errors';
  }

  const errorLines = errors.map(error => 
    `Row ${error.row}: ${error.message}`
  );

  return errorLines.join('\n');
}

/**
 * Check if validation should prevent import
 * 
 * @param {Object} validationResult - Result from validateData
 * @returns {boolean} True if import should be blocked
 */
export function shouldBlockImport(validationResult) {
  return !validationResult.isValid;
}
