/**
 * Input Sanitizer Utility
 * 
 * Provides comprehensive input sanitization to prevent security vulnerabilities:
 * - SQL injection prevention
 * - Script injection prevention
 * - Control character removal
 * - Whitespace normalization
 * - Data type validation
 * 
 * Requirements: 20.5
 */

/**
 * Sanitize a string value to prevent SQL injection and script injection
 * @param {any} value - Value to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(value) {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert to string
  let sanitized = String(value);

  // Remove control characters (except newline, tab, carriage return)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove or escape SQL special characters
  // Note: Supabase/PostgreSQL uses parameterized queries, but we sanitize as defense-in-depth
  sanitized = sanitized.replace(/[;'"\\]/g, '');

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length to prevent buffer overflow attacks
  const MAX_STRING_LENGTH = 1000;
  if (sanitized.length > MAX_STRING_LENGTH) {
    sanitized = sanitized.substring(0, MAX_STRING_LENGTH);
  }

  return sanitized;
}

/**
 * Sanitize a numeric value
 * @param {any} value - Value to sanitize
 * @param {Object} options - Validation options
 * @returns {number|null} Sanitized number or null if invalid
 */
export function sanitizeNumber(value, options = {}) {
  const { min = -Infinity, max = Infinity, allowNegative = true } = options;

  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Convert to number
  let num = Number(value);

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  // Check negative constraint
  if (!allowNegative && num < 0) {
    return null;
  }

  // Check range
  if (num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * Sanitize a date value
 * @param {any} value - Value to sanitize
 * @returns {string|null} Sanitized date in YYYY-MM-DD format or null if invalid
 */
export function sanitizeDate(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Try to parse date
  const date = new Date(value);

  // Check if valid date
  if (isNaN(date.getTime())) {
    return null;
  }

  // Check if date is reasonable (between 1900 and 2100)
  const year = date.getFullYear();
  if (year < 1900 || year > 2100) {
    return null;
  }

  // Return in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

/**
 * Sanitize an email address
 * @param {any} value - Value to sanitize
 * @returns {string|null} Sanitized email or null if invalid
 */
export function sanitizeEmail(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Convert to string and trim
  let email = String(value).trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

  if (!emailRegex.test(email)) {
    return null;
  }

  // Sanitize string (remove dangerous characters)
  email = sanitizeString(email);

  // Limit length
  if (email.length > 254) {
    return null;
  }

  return email;
}

/**
 * Sanitize a phone number
 * @param {any} value - Value to sanitize
 * @returns {string|null} Sanitized phone number or null if invalid
 */
export function sanitizePhone(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Convert to string
  let phone = String(value);

  // Remove all non-digit characters except + at the start
  phone = phone.replace(/[^\d+]/g, '');

  // Ensure + is only at the start
  if (phone.includes('+')) {
    const parts = phone.split('+');
    phone = '+' + parts.join('');
  }

  // Validate length (7-15 digits is standard for international numbers)
  const digitCount = phone.replace(/\D/g, '').length;
  if (digitCount < 7 || digitCount > 15) {
    return null;
  }

  return phone;
}

/**
 * Sanitize an entire object (all string fields)
 * @param {Object} obj - Object to sanitize
 * @param {Object} schema - Schema defining field types and validation
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj, schema = {}) {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    const fieldSchema = schema[key] || { type: 'string' };

    switch (fieldSchema.type) {
      case 'string':
        sanitized[key] = sanitizeString(value);
        break;

      case 'number':
        sanitized[key] = sanitizeNumber(value, fieldSchema.options);
        break;

      case 'date':
        sanitized[key] = sanitizeDate(value);
        break;

      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;

      case 'phone':
        sanitized[key] = sanitizePhone(value);
        break;

      default:
        // Default to string sanitization
        sanitized[key] = sanitizeString(value);
    }
  }

  return sanitized;
}

/**
 * Sanitize an array of objects
 * @param {Array} arr - Array of objects to sanitize
 * @param {Object} schema - Schema defining field types and validation
 * @returns {Array} Array of sanitized objects
 */
export function sanitizeArray(arr, schema = {}) {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr.map(item => sanitizeObject(item, schema));
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @param {Array<string>} allowedExtensions - Allowed file extensions
 * @returns {Object} Validation result
 */
export function validateFileType(file, allowedTypes = [], allowedExtensions = []) {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  // Check MIME type
  const mimeTypeValid = allowedTypes.length === 0 || allowedTypes.includes(file.type);

  // Check file extension
  const fileExtension = file.name.split('.').pop().toLowerCase();
  const extensionValid = allowedExtensions.length === 0 || allowedExtensions.includes(fileExtension);

  if (!mimeTypeValid && !extensionValid) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
    };
  }

  return {
    isValid: true
  };
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeBytes - Maximum file size in bytes
 * @returns {Object} Validation result
 */
export function validateFileSize(file, maxSizeBytes) {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
    };
  }

  return {
    isValid: true
  };
}

/**
 * Comprehensive file validation
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateFile(file, options = {}) {
  const {
    allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    allowedExtensions = ['csv', 'xls', 'xlsx'],
    maxSizeBytes = 5 * 1024 * 1024 // 5MB default
  } = options;

  // Validate file type
  const typeValidation = validateFileType(file, allowedTypes, allowedExtensions);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, maxSizeBytes);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  return {
    isValid: true
  };
}

/**
 * Sanitize CSV data before import
 * @param {Array} data - Array of CSV row objects
 * @param {Object} schema - Schema defining field types and validation
 * @returns {Array} Sanitized data
 */
export function sanitizeCSVData(data, schema = {}) {
  return sanitizeArray(data, schema);
}

export default {
  sanitizeString,
  sanitizeNumber,
  sanitizeDate,
  sanitizeEmail,
  sanitizePhone,
  sanitizeObject,
  sanitizeArray,
  validateFileType,
  validateFileSize,
  validateFile,
  sanitizeCSVData
};
