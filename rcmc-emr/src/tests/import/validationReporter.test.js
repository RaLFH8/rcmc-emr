/**
 * Validation Reporter Unit Tests
 * 
 * Tests for validation error reporting and formatting
 */

import { describe, it, expect } from 'vitest';
import {
  createErrorReport,
  groupErrorsByRow,
  groupErrorsByField,
  groupErrorsByType,
  filterErrorsByRows,
  filterErrorsByFields,
  filterErrorsByType,
  formatErrorSummary,
  formatErrorDetails,
  formatErrorsByRow,
  getErrorTypeLabel,
  getErrorTypeColor,
  getErrorTypeIcon,
  getErrorGuidance,
  createUserFriendlyMessage,
  analyzeAutoFixPotential
} from '../../utils/import/validationReporter.js';
import { ValidationErrorType } from '../../utils/import/validationEngine.js';

describe('Validation Reporter', () => {
  const sampleErrors = [
    { row: 1, field: 'name', value: '', type: ValidationErrorType.MISSING, message: 'Missing required field: name' },
    { row: 1, field: 'age', value: 'invalid', type: ValidationErrorType.INVALID_TYPE, message: 'Invalid age' },
    { row: 2, field: 'age', value: 200, type: ValidationErrorType.OUT_OF_RANGE, message: 'Age out of range' },
    { row: 3, field: 'email', value: 'bad-email', type: ValidationErrorType.INVALID_FORMAT, message: 'Invalid email format' }
  ];

  describe('createErrorReport', () => {
    it('should create error report with summary', () => {
      const validationResult = {
        totalRows: 10,
        validRows: 7,
        invalidRows: 3,
        errors: sampleErrors,
        errorsByType: {
          [ValidationErrorType.MISSING]: [sampleErrors[0]],
          [ValidationErrorType.INVALID_TYPE]: [sampleErrors[1]],
          [ValidationErrorType.OUT_OF_RANGE]: [sampleErrors[2]],
          [ValidationErrorType.INVALID_FORMAT]: [sampleErrors[3]],
          [ValidationErrorType.CUSTOM_ERROR]: []
        }
      };

      const report = createErrorReport(validationResult);

      expect(report.summary.totalRows).toBe(10);
      expect(report.summary.validRows).toBe(7);
      expect(report.summary.invalidRows).toBe(3);
      expect(report.summary.totalErrors).toBe(4);
      expect(report.hasErrors).toBe(true);
    });

    it('should include error details', () => {
      const validationResult = {
        totalRows: 1,
        validRows: 0,
        invalidRows: 1,
        errors: [sampleErrors[0]],
        errorsByType: {
          [ValidationErrorType.MISSING]: [sampleErrors[0]],
          [ValidationErrorType.INVALID_TYPE]: [],
          [ValidationErrorType.OUT_OF_RANGE]: [],
          [ValidationErrorType.INVALID_FORMAT]: [],
          [ValidationErrorType.CUSTOM_ERROR]: []
        }
      };

      const report = createErrorReport(validationResult);

      expect(report.errors).toHaveLength(1);
      expect(report.errors[0].row).toBe(1);
      expect(report.errors[0].field).toBe('name');
    });
  });

  describe('groupErrorsByRow', () => {
    it('should group errors by row number', () => {
      const grouped = groupErrorsByRow(sampleErrors);

      expect(grouped[1]).toHaveLength(2);
      expect(grouped[2]).toHaveLength(1);
      expect(grouped[3]).toHaveLength(1);
    });

    it('should handle empty errors', () => {
      const grouped = groupErrorsByRow([]);

      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });

  describe('groupErrorsByField', () => {
    it('should group errors by field name', () => {
      const grouped = groupErrorsByField(sampleErrors);

      expect(grouped['name']).toHaveLength(1);
      expect(grouped['age']).toHaveLength(2);
      expect(grouped['email']).toHaveLength(1);
    });
  });

  describe('groupErrorsByType', () => {
    it('should group errors by error type', () => {
      const grouped = groupErrorsByType(sampleErrors);

      expect(grouped[ValidationErrorType.MISSING]).toHaveLength(1);
      expect(grouped[ValidationErrorType.INVALID_TYPE]).toHaveLength(1);
      expect(grouped[ValidationErrorType.OUT_OF_RANGE]).toHaveLength(1);
      expect(grouped[ValidationErrorType.INVALID_FORMAT]).toHaveLength(1);
    });
  });

  describe('filterErrorsByRows', () => {
    it('should filter errors by row numbers', () => {
      const filtered = filterErrorsByRows(sampleErrors, [1, 3]);

      expect(filtered).toHaveLength(3);
      expect(filtered.every(e => e.row === 1 || e.row === 3)).toBe(true);
    });
  });

  describe('filterErrorsByFields', () => {
    it('should filter errors by field names', () => {
      const filtered = filterErrorsByFields(sampleErrors, ['age']);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(e => e.field === 'age')).toBe(true);
    });
  });

  describe('filterErrorsByType', () => {
    it('should filter errors by error type', () => {
      const filtered = filterErrorsByType(sampleErrors, ValidationErrorType.MISSING);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe(ValidationErrorType.MISSING);
    });
  });

  describe('formatErrorSummary', () => {
    it('should format error summary as text', () => {
      const report = {
        hasErrors: true,
        summary: {
          totalRows: 10,
          validRows: 7,
          invalidRows: 3,
          totalErrors: 4,
          errorsByType: {
            missing: 1,
            invalidType: 1,
            outOfRange: 1,
            invalidFormat: 1,
            custom: 0
          }
        }
      };

      const formatted = formatErrorSummary(report);

      expect(formatted).toContain('Total Rows: 10');
      expect(formatted).toContain('Valid Rows: 7');
      expect(formatted).toContain('Invalid Rows: 3');
      expect(formatted).toContain('Total Errors: 4');
    });

    it('should show success message when no errors', () => {
      const report = { hasErrors: false };
      const formatted = formatErrorSummary(report);

      expect(formatted).toContain('passed validation');
    });
  });

  describe('formatErrorDetails', () => {
    it('should format error details as text', () => {
      const formatted = formatErrorDetails(sampleErrors);

      expect(formatted).toContain('Row 1');
      expect(formatted).toContain('Field "name"');
      expect(formatted).toContain('Missing required field: name');
    });

    it('should limit number of errors displayed', () => {
      const manyErrors = Array(100).fill(sampleErrors[0]);
      const formatted = formatErrorDetails(manyErrors, 10);

      expect(formatted).toContain('and 90 more errors');
    });

    it('should handle empty errors', () => {
      const formatted = formatErrorDetails([]);

      expect(formatted).toBe('No errors to display');
    });
  });

  describe('formatErrorsByRow', () => {
    it('should format grouped errors by row', () => {
      const grouped = groupErrorsByRow(sampleErrors);
      const formatted = formatErrorsByRow(grouped);

      expect(formatted).toContain('Row 1:');
      expect(formatted).toContain('name:');
      expect(formatted).toContain('age:');
    });

    it('should limit number of rows displayed', () => {
      const manyErrors = Array(50).fill(null).map((_, i) => ({
        row: i + 1,
        field: 'test',
        message: 'Error'
      }));
      const grouped = groupErrorsByRow(manyErrors);
      const formatted = formatErrorsByRow(grouped, 10);

      expect(formatted).toContain('and 40 more rows');
    });
  });

  describe('getErrorTypeLabel', () => {
    it('should return human-readable labels', () => {
      expect(getErrorTypeLabel(ValidationErrorType.MISSING)).toBe('Missing Field');
      expect(getErrorTypeLabel(ValidationErrorType.INVALID_TYPE)).toBe('Invalid Type');
      expect(getErrorTypeLabel(ValidationErrorType.OUT_OF_RANGE)).toBe('Out of Range');
      expect(getErrorTypeLabel(ValidationErrorType.INVALID_FORMAT)).toBe('Invalid Format');
      expect(getErrorTypeLabel(ValidationErrorType.CUSTOM_ERROR)).toBe('Validation Error');
    });
  });

  describe('getErrorTypeColor', () => {
    it('should return Tailwind CSS color classes', () => {
      expect(getErrorTypeColor(ValidationErrorType.MISSING)).toContain('text-');
      expect(getErrorTypeColor(ValidationErrorType.INVALID_TYPE)).toContain('text-');
    });
  });

  describe('getErrorTypeIcon', () => {
    it('should return emoji icons', () => {
      expect(getErrorTypeIcon(ValidationErrorType.MISSING)).toBeTruthy();
      expect(getErrorTypeIcon(ValidationErrorType.INVALID_TYPE)).toBeTruthy();
    });
  });

  describe('getErrorGuidance', () => {
    it('should provide actionable guidance', () => {
      const guidance = getErrorGuidance(ValidationErrorType.MISSING, 'name');

      expect(guidance).toContain('name');
      expect(guidance).toContain('required');
    });

    it('should provide type-specific guidance', () => {
      const guidanceType = getErrorGuidance(ValidationErrorType.INVALID_TYPE, 'age');
      const guidanceRange = getErrorGuidance(ValidationErrorType.OUT_OF_RANGE, 'price');

      expect(guidanceType).toContain('data type');
      expect(guidanceRange).toContain('range');
    });
  });

  describe('createUserFriendlyMessage', () => {
    it('should create user-friendly error message', () => {
      const error = sampleErrors[0];
      const message = createUserFriendlyMessage(error);

      expect(message).toContain('Row 1');
      expect(message).toContain('Missing required field: name');
    });
  });

  describe('analyzeAutoFixPotential', () => {
    it('should identify fixable errors', () => {
      const analysis = analyzeAutoFixPotential(sampleErrors);

      expect(analysis.fixableCount).toBeGreaterThanOrEqual(0);
      expect(analysis.notFixableCount).toBeGreaterThanOrEqual(0);
      expect(analysis.fixableCount + analysis.notFixableCount).toBe(sampleErrors.length);
    });

    it('should mark format errors as potentially fixable', () => {
      const formatErrors = [sampleErrors[3]]; // Invalid format error
      const analysis = analyzeAutoFixPotential(formatErrors);

      expect(analysis.fixableCount).toBe(1);
    });
  });
});
