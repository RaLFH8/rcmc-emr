/**
 * Validation Error Export Unit Tests
 * 
 * Tests for CSV export of validation errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  exportErrorsToCSV,
  exportErrorReportToCSV,
  exportInvalidRowsToCSV,
  exportGroupedErrorsToCSV,
  exportFieldGroupedErrorsToCSV,
  createErrorCSVDownload,
  generateErrorFilename,
  exportSummaryStatistics
} from '../../utils/import/validationErrorExport.js';
import { ValidationErrorType } from '../../utils/import/validationEngine.js';
import { parseCSVString } from '../../utils/import/csvParser.js';

describe('Validation Error Export', () => {
  const sampleErrors = [
    { row: 1, field: 'name', value: '', type: ValidationErrorType.MISSING, message: 'Missing required field: name' },
    { row: 2, field: 'age', value: 'invalid', type: ValidationErrorType.INVALID_TYPE, message: 'Invalid age' },
    { row: 3, field: 'price', value: -50, type: ValidationErrorType.OUT_OF_RANGE, message: 'Price out of range' }
  ];

  describe('exportErrorsToCSV', () => {
    it('should export errors to CSV format', () => {
      const csv = exportErrorsToCSV(sampleErrors);

      expect(csv).toContain('Row');
      expect(csv).toContain('Field');
      expect(csv).toContain('Error Type');
      expect(csv).toContain('Error Message');
      expect(csv).toContain('name');
      expect(csv).toContain('age');
    });

    it('should handle empty errors', () => {
      const csv = exportErrorsToCSV([]);

      expect(csv).toContain('Row,Field,Value,Error Type,Error Message');
    });

    it('should be parseable back to data', () => {
      const csv = exportErrorsToCSV(sampleErrors);
      const parsed = parseCSVString(csv);

      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveLength(3);
      expect(parsed.headers).toContain('Row');
      expect(parsed.headers).toContain('Field');
    });
  });

  describe('exportErrorReportToCSV', () => {
    it('should export error report with summary', () => {
      const errorReport = {
        hasErrors: true,
        summary: {
          totalRows: 10,
          validRows: 7,
          invalidRows: 3,
          totalErrors: 3,
          errorsByType: {
            missing: 1,
            invalidType: 1,
            outOfRange: 1,
            invalidFormat: 0,
            custom: 0
          }
        },
        errors: sampleErrors
      };

      const csv = exportErrorReportToCSV(errorReport);

      expect(csv).toContain('Total Rows');
      expect(csv).toContain('Valid Rows');
      expect(csv).toContain('Invalid Rows');
      expect(csv).toContain('Missing Fields');
    });

    it('should handle no errors case', () => {
      const errorReport = { hasErrors: false };
      const csv = exportErrorReportToCSV(errorReport);

      expect(csv).toContain('Success');
      expect(csv).toContain('All rows passed validation');
    });
  });

  describe('exportInvalidRowsToCSV', () => {
    it('should export invalid rows with errors', () => {
      const invalidData = [
        {
          _rowIndex: 1,
          name: '',
          age: 30,
          _errors: [sampleErrors[0]]
        },
        {
          _rowIndex: 2,
          name: 'John',
          age: 'invalid',
          _errors: [sampleErrors[1]]
        }
      ];

      const headers = ['name', 'age'];
      const csv = exportInvalidRowsToCSV(invalidData, headers);

      expect(csv).toContain('Row Number');
      expect(csv).toContain('name');
      expect(csv).toContain('age');
      expect(csv).toContain('Errors');
    });

    it('should handle empty invalid data', () => {
      const csv = exportInvalidRowsToCSV([], ['name', 'age']);

      expect(csv).toBe('');
    });
  });

  describe('exportGroupedErrorsToCSV', () => {
    it('should export errors grouped by row', () => {
      const groupedErrors = {
        1: [sampleErrors[0]],
        2: [sampleErrors[1]],
        3: [sampleErrors[2]]
      };

      const csv = exportGroupedErrorsToCSV(groupedErrors);

      expect(csv).toContain('Row');
      expect(csv).toContain('Error Number');
      expect(csv).toContain('Field');
    });

    it('should sort rows numerically', () => {
      const groupedErrors = {
        10: [sampleErrors[0]],
        2: [sampleErrors[1]],
        5: [sampleErrors[2]]
      };

      const csv = exportGroupedErrorsToCSV(groupedErrors);
      const parsed = parseCSVString(csv);

      expect(parsed.data[0].Row).toBe(2);
      expect(parsed.data[1].Row).toBe(5);
      expect(parsed.data[2].Row).toBe(10);
    });
  });

  describe('exportFieldGroupedErrorsToCSV', () => {
    it('should export errors grouped by field', () => {
      const groupedErrors = {
        name: [sampleErrors[0]],
        age: [sampleErrors[1]],
        price: [sampleErrors[2]]
      };

      const csv = exportFieldGroupedErrorsToCSV(groupedErrors);

      expect(csv).toContain('Field');
      expect(csv).toContain('Error Number');
      expect(csv).toContain('Row');
    });

    it('should sort fields alphabetically', () => {
      const groupedErrors = {
        price: [sampleErrors[2]],
        age: [sampleErrors[1]],
        name: [sampleErrors[0]]
      };

      const csv = exportFieldGroupedErrorsToCSV(groupedErrors);
      const parsed = parseCSVString(csv);

      expect(parsed.data[0].Field).toBe('age');
      expect(parsed.data[1].Field).toBe('name');
      expect(parsed.data[2].Field).toBe('price');
    });
  });

  describe('createErrorCSVDownload', () => {
    it('should create blob and URL', () => {
      const csvContent = 'Row,Field,Message\n1,name,Error';
      const download = createErrorCSVDownload(csvContent, 'test.csv');

      expect(download.blob).toBeInstanceOf(Blob);
      expect(download.url).toBeTruthy();
      expect(download.filename).toBe('test.csv');
      expect(typeof download.download).toBe('function');

      // Cleanup
      URL.revokeObjectURL(download.url);
    });

    it('should use default filename if not provided', () => {
      const csvContent = 'Row,Field,Message\n1,name,Error';
      const download = createErrorCSVDownload(csvContent);

      expect(download.filename).toBe('validation-errors.csv');

      // Cleanup
      URL.revokeObjectURL(download.url);
    });
  });

  describe('generateErrorFilename', () => {
    it('should generate timestamped filename', () => {
      const filename = generateErrorFilename('test-errors');

      expect(filename).toContain('test-errors_');
      expect(filename).toContain('.csv');
    });

    it('should use default prefix if not provided', () => {
      const filename = generateErrorFilename();

      expect(filename).toContain('validation-errors_');
    });

    it('should support custom extension', () => {
      const filename = generateErrorFilename('test', 'txt');

      expect(filename).toContain('.txt');
    });
  });

  describe('exportSummaryStatistics', () => {
    it('should export summary statistics', () => {
      const errorReport = {
        summary: {
          totalRows: 100,
          validRows: 85,
          invalidRows: 15,
          totalErrors: 20,
          errorsByType: {
            missing: 5,
            invalidType: 8,
            outOfRange: 4,
            invalidFormat: 3,
            custom: 0
          }
        }
      };

      const csv = exportSummaryStatistics(errorReport);

      expect(csv).toContain('Category');
      expect(csv).toContain('Metric');
      expect(csv).toContain('Value');
      expect(csv).toContain('Overview');
      expect(csv).toContain('Error Types');
      expect(csv).toContain('Validation Pass Rate');
    });

    it('should calculate pass rate correctly', () => {
      const errorReport = {
        summary: {
          totalRows: 100,
          validRows: 85,
          invalidRows: 15,
          totalErrors: 20,
          errorsByType: {
            missing: 5,
            invalidType: 8,
            outOfRange: 4,
            invalidFormat: 3,
            custom: 0
          }
        }
      };

      const csv = exportSummaryStatistics(errorReport);

      expect(csv).toContain('85.00%');
    });
  });

  describe('CSV Round-Trip Validation', () => {
    it('should preserve error data through export and parse', () => {
      const csv = exportErrorsToCSV(sampleErrors);
      const parsed = parseCSVString(csv);

      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveLength(sampleErrors.length);
      
      // Check first error
      expect(parsed.data[0].Row).toBe(1);
      expect(parsed.data[0].Field).toBe('name');
      expect(parsed.data[0]['Error Message']).toContain('Missing required field');
    });

    it('should handle special characters in error messages', () => {
      const specialErrors = [
        {
          row: 1,
          field: 'description',
          value: 'Test, "quoted", value\nwith newline',
          type: ValidationErrorType.INVALID_FORMAT,
          message: 'Invalid format: contains special chars, "quotes", and\nnewlines'
        }
      ];

      const csv = exportErrorsToCSV(specialErrors);
      const parsed = parseCSVString(csv);

      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveLength(1);
    });
  });
});
