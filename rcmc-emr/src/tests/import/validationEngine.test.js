/**
 * Validation Engine Unit Tests
 * 
 * Tests for validation rule system and data validation
 */

import { describe, it, expect } from 'vitest';
import {
  ValidationRuleType,
  ValidationErrorType,
  DataType,
  createValidationRule,
  requiredField,
  typeValidation,
  rangeValidation,
  formatValidation,
  customValidation,
  validateRow,
  validateData,
  getErrorSummary,
  formatValidationErrors,
  shouldBlockImport
} from '../../utils/import/validationEngine.js';

describe('Validation Engine', () => {
  describe('createValidationRule', () => {
    it('should create a validation rule with all properties', () => {
      const validator = (value) => value > 0;
      const rule = createValidationRule('price', ValidationRuleType.RANGE, validator, 'Price must be positive');

      expect(rule.field).toBe('price');
      expect(rule.type).toBe(ValidationRuleType.RANGE);
      expect(rule.validator).toBe(validator);
      expect(rule.message).toBe('Price must be positive');
    });
  });

  describe('requiredField', () => {
    it('should validate non-empty values', () => {
      const rule = requiredField('name');
      
      expect(rule.validator('John')).toBe(true);
      expect(rule.validator(123)).toBe(true);
      expect(rule.validator(0)).toBe(true);
    });

    it('should reject empty values', () => {
      const rule = requiredField('name');
      
      expect(rule.validator('')).toBe(false);
      expect(rule.validator(null)).toBe(false);
      expect(rule.validator(undefined)).toBe(false);
    });

    it('should use custom message if provided', () => {
      const rule = requiredField('email', 'Email is required');
      
      expect(rule.message).toBe('Email is required');
    });
  });

  describe('typeValidation', () => {
    it('should validate string type', () => {
      const rule = typeValidation('name', DataType.STRING);
      
      expect(rule.validator('John')).toBe(true);
      expect(rule.validator(123)).toBe(false);
    });

    it('should validate number type', () => {
      const rule = typeValidation('age', DataType.NUMBER);
      
      expect(rule.validator(25)).toBe(true);
      expect(rule.validator(25.5)).toBe(true);
      expect(rule.validator('25')).toBe(false);
      expect(rule.validator(NaN)).toBe(false);
    });

    it('should validate integer type', () => {
      const rule = typeValidation('count', DataType.INTEGER);
      
      expect(rule.validator(25)).toBe(true);
      expect(rule.validator(25.5)).toBe(false);
      expect(rule.validator('25')).toBe(false);
    });

    it('should validate date type', () => {
      const rule = typeValidation('date', DataType.DATE);
      
      expect(rule.validator('2024-01-15')).toBe(true);
      expect(rule.validator(new Date())).toBe(true);
      expect(rule.validator('invalid-date')).toBe(false);
    });

    it('should validate email type', () => {
      const rule = typeValidation('email', DataType.EMAIL);
      
      expect(rule.validator('test@example.com')).toBe(true);
      expect(rule.validator('invalid-email')).toBe(false);
      expect(rule.validator('test@')).toBe(false);
    });

    it('should validate phone type', () => {
      const rule = typeValidation('phone', DataType.PHONE);
      
      expect(rule.validator('09171234567')).toBe(true);
      expect(rule.validator('+639171234567')).toBe(true);
      expect(rule.validator('0917-123-4567')).toBe(true);
      expect(rule.validator('123')).toBe(false);
    });

    it('should skip validation for empty values', () => {
      const rule = typeValidation('age', DataType.NUMBER);
      
      expect(rule.validator('')).toBe(true);
      expect(rule.validator(null)).toBe(true);
      expect(rule.validator(undefined)).toBe(true);
    });
  });

  describe('rangeValidation', () => {
    it('should validate values within range', () => {
      const rule = rangeValidation('age', 0, 150);
      
      expect(rule.validator(25)).toBe(true);
      expect(rule.validator(0)).toBe(true);
      expect(rule.validator(150)).toBe(true);
    });

    it('should reject values outside range', () => {
      const rule = rangeValidation('age', 0, 150);
      
      expect(rule.validator(-1)).toBe(false);
      expect(rule.validator(151)).toBe(false);
    });

    it('should handle string numbers', () => {
      const rule = rangeValidation('price', 0, 1000);
      
      expect(rule.validator('500')).toBe(true);
      expect(rule.validator('1500')).toBe(false);
    });

    it('should skip validation for empty values', () => {
      const rule = rangeValidation('age', 0, 150);
      
      expect(rule.validator('')).toBe(true);
      expect(rule.validator(null)).toBe(true);
    });
  });

  describe('formatValidation', () => {
    it('should validate values matching pattern', () => {
      const rule = formatValidation('age_sex', /^\d+\/[MF]$/i, 'number/M or number/F');
      
      expect(rule.validator('25/M')).toBe(true);
      expect(rule.validator('30/F')).toBe(true);
      expect(rule.validator('25/m')).toBe(true);
    });

    it('should reject values not matching pattern', () => {
      const rule = formatValidation('age_sex', /^\d+\/[MF]$/i, 'number/M or number/F');
      
      expect(rule.validator('25')).toBe(false);
      expect(rule.validator('M')).toBe(false);
      expect(rule.validator('25/X')).toBe(false);
    });

    it('should skip validation for empty values', () => {
      const rule = formatValidation('age_sex', /^\d+\/[MF]$/i, 'number/M or number/F');
      
      expect(rule.validator('')).toBe(true);
      expect(rule.validator(null)).toBe(true);
    });
  });

  describe('customValidation', () => {
    it('should use custom validator function', () => {
      const rule = customValidation('doctor', (value, row) => {
        return value === 'Dr. Santos' || value === 'Dr. Reyes';
      }, 'Doctor not found');
      
      expect(rule.validator('Dr. Santos')).toBe(true);
      expect(rule.validator('Dr. Unknown')).toBe(false);
    });

    it('should pass row context to validator', () => {
      const rule = customValidation('discount', (value, row) => {
        return value <= row.payment;
      }, 'Discount cannot exceed payment');
      
      expect(rule.validator(50, { payment: 100 })).toBe(true);
      expect(rule.validator(150, { payment: 100 })).toBe(false);
    });
  });

  describe('validateRow', () => {
    it('should validate row with all rules passing', () => {
      const rules = [
        requiredField('name'),
        typeValidation('age', DataType.NUMBER),
        rangeValidation('age', 0, 150)
      ];

      const row = { name: 'John', age: 30 };
      const result = validateRow(row, 1, rules);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const rules = [
        requiredField('name'),
        requiredField('age'),
        typeValidation('age', DataType.NUMBER)
      ];

      const row = { name: '', age: 'invalid' };
      const result = validateRow(row, 1, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].type).toBe(ValidationErrorType.MISSING);
      expect(result.errors[1].type).toBe(ValidationErrorType.INVALID_TYPE);
    });

    it('should include row number in errors', () => {
      const rules = [requiredField('name')];
      const row = { name: '' };
      const result = validateRow(row, 5, rules);

      expect(result.errors[0].row).toBe(5);
    });
  });

  describe('validateData', () => {
    it('should validate all rows in dataset', () => {
      const rules = [
        requiredField('name'),
        typeValidation('age', DataType.NUMBER)
      ];

      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
        { name: 'Bob', age: 35 }
      ];

      const result = validateData(data, rules);

      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(3);
      expect(result.validRows).toBe(3);
      expect(result.invalidRows).toBe(0);
    });

    it('should separate valid and invalid rows', () => {
      const rules = [
        requiredField('name'),
        typeValidation('age', DataType.NUMBER)
      ];

      const data = [
        { name: 'John', age: 30 },
        { name: '', age: 25 },
        { name: 'Bob', age: 'invalid' }
      ];

      const result = validateData(data, rules);

      expect(result.isValid).toBe(false);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(2);
      expect(result.validData).toHaveLength(1);
      expect(result.invalidData).toHaveLength(2);
    });

    it('should group errors by type', () => {
      const rules = [
        requiredField('name'),
        typeValidation('age', DataType.NUMBER),
        rangeValidation('age', 0, 150)
      ];

      const data = [
        { name: '', age: 'invalid' },
        { name: 'John', age: 200 }
      ];

      const result = validateData(data, rules);

      expect(result.errorsByType[ValidationErrorType.MISSING].length).toBeGreaterThan(0);
      expect(result.errorsByType[ValidationErrorType.INVALID_TYPE].length).toBeGreaterThan(0);
      expect(result.errorsByType[ValidationErrorType.OUT_OF_RANGE].length).toBeGreaterThan(0);
    });
  });

  describe('getErrorSummary', () => {
    it('should return error counts by type', () => {
      const validationResult = {
        errors: [
          { type: ValidationErrorType.MISSING },
          { type: ValidationErrorType.MISSING },
          { type: ValidationErrorType.INVALID_TYPE }
        ],
        errorsByType: {
          [ValidationErrorType.MISSING]: [{}, {}],
          [ValidationErrorType.INVALID_TYPE]: [{}],
          [ValidationErrorType.OUT_OF_RANGE]: [],
          [ValidationErrorType.INVALID_FORMAT]: [],
          [ValidationErrorType.CUSTOM_ERROR]: []
        }
      };

      const summary = getErrorSummary(validationResult);

      expect(summary.totalErrors).toBe(3);
      expect(summary.missingFields).toBe(2);
      expect(summary.invalidTypes).toBe(1);
      expect(summary.outOfRange).toBe(0);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format errors as text', () => {
      const errors = [
        { row: 1, message: 'Missing required field: name' },
        { row: 2, message: 'Invalid age: expected number' }
      ];

      const formatted = formatValidationErrors(errors);

      expect(formatted).toContain('Row 1');
      expect(formatted).toContain('Row 2');
      expect(formatted).toContain('Missing required field: name');
    });

    it('should handle empty errors', () => {
      const formatted = formatValidationErrors([]);

      expect(formatted).toBe('No validation errors');
    });
  });

  describe('shouldBlockImport', () => {
    it('should block import when validation fails', () => {
      const result = { isValid: false };
      
      expect(shouldBlockImport(result)).toBe(true);
    });

    it('should allow import when validation passes', () => {
      const result = { isValid: true };
      
      expect(shouldBlockImport(result)).toBe(false);
    });
  });
});
