/**
 * CSV Parser Unit Tests
 * 
 * Tests for CSV parsing functionality
 */

import { describe, it, expect } from 'vitest';
import { parseCSVString, validateCSVStructure, getCSVPreview } from '../../utils/import/csvParser.js';
import { printCSV, escapeCSVValue, validateRoundTrip } from '../../utils/import/csvPrettyPrinter.js';

describe('CSV Parser', () => {
  describe('parseCSVString', () => {
    it('should parse valid CSV with headers', () => {
      const csv = 'Name,Age,City\nJohn,30,NYC\nJane,25,LA';
      const result = parseCSVString(csv);

      expect(result.success).toBe(true);
      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.rowCount).toBe(2);
      expect(result.data[0]).toEqual({ Name: 'John', Age: 30, City: 'NYC' });
    });

    it('should trim whitespace from values', () => {
      const csv = 'Name,Age\n  John  ,  30  ';
      const result = parseCSVString(csv);

      expect(result.success).toBe(true);
      expect(result.data[0].Name).toBe('John');
      expect(result.data[0].Age).toBe(30);
    });

    it('should handle UTF-8 characters', () => {
      const csv = 'Name,City\nJosé,São Paulo\nMüller,München';
      const result = parseCSVString(csv);

      expect(result.success).toBe(true);
      expect(result.data[0].Name).toBe('José');
      expect(result.data[1].City).toBe('München');
    });

    it('should skip empty lines', () => {
      const csv = 'Name,Age\nJohn,30\n\nJane,25\n\n';
      const result = parseCSVString(csv);

      expect(result.success).toBe(true);
      expect(result.rowCount).toBe(2);
    });

    it('should return error for empty CSV', () => {
      const csv = '';
      const result = parseCSVString(csv);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('EMPTY_DATA');
    });

    it('should return error for CSV without headers', () => {
      const csv = '\n\n';
      const result = parseCSVString(csv);

      expect(result.success).toBe(false);
    });
  });

  describe('validateCSVStructure', () => {
    it('should validate CSV with required headers', () => {
      const parseResult = {
        success: true,
        headers: ['Name', 'Age', 'City'],
        data: []
      };

      const validation = validateCSVStructure(parseResult, ['Name', 'Age']);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing required headers', () => {
      const parseResult = {
        success: true,
        headers: ['Name', 'City'],
        data: []
      };

      const validation = validateCSVStructure(parseResult, ['Name', 'Age', 'Email']);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].code).toBe('MISSING_HEADERS');
      expect(validation.errors[0].missingHeaders).toEqual(['Age', 'Email']);
    });
  });

  describe('getCSVPreview', () => {
    it('should return first N rows', () => {
      const parseResult = {
        success: true,
        data: [
          { Name: 'John', Age: 30 },
          { Name: 'Jane', Age: 25 },
          { Name: 'Bob', Age: 35 },
          { Name: 'Alice', Age: 28 }
        ]
      };

      const preview = getCSVPreview(parseResult, 2);

      expect(preview).toHaveLength(2);
      expect(preview[0].Name).toBe('John');
      expect(preview[1].Name).toBe('Jane');
    });

    it('should return all rows if count exceeds data length', () => {
      const parseResult = {
        success: true,
        data: [
          { Name: 'John', Age: 30 },
          { Name: 'Jane', Age: 25 }
        ]
      };

      const preview = getCSVPreview(parseResult, 10);

      expect(preview).toHaveLength(2);
    });
  });
});

describe('CSV Pretty Printer', () => {
  describe('printCSV', () => {
    it('should convert data to CSV string', () => {
      const data = [
        { Name: 'John', Age: 30, City: 'NYC' },
        { Name: 'Jane', Age: 25, City: 'LA' }
      ];

      const csv = printCSV(data);

      expect(csv).toContain('Name');
      expect(csv).toContain('John');
      expect(csv).toContain('Jane');
    });

    it('should include headers by default', () => {
      const data = [{ Name: 'John', Age: 30 }];
      const csv = printCSV(data);

      expect(csv).toContain('Name');
      expect(csv).toContain('Age');
    });

    it('should handle empty array', () => {
      const data = [];
      const csv = printCSV(data);

      expect(csv).toBe('');
    });

    it('should throw error for non-array input', () => {
      expect(() => printCSV(null)).toThrow();
      expect(() => printCSV('not an array')).toThrow();
    });
  });

  describe('escapeCSVValue', () => {
    it('should escape commas', () => {
      const value = 'Hello, World';
      const escaped = escapeCSVValue(value);

      expect(escaped).toBe('"Hello, World"');
    });

    it('should escape quotes', () => {
      const value = 'Say "Hello"';
      const escaped = escapeCSVValue(value);

      expect(escaped).toBe('"Say ""Hello"""');
    });

    it('should escape newlines', () => {
      const value = 'Line 1\nLine 2';
      const escaped = escapeCSVValue(value);

      expect(escaped).toContain('"');
    });

    it('should not escape simple values', () => {
      const value = 'SimpleValue';
      const escaped = escapeCSVValue(value);

      expect(escaped).toBe('SimpleValue');
    });

    it('should handle null and undefined', () => {
      expect(escapeCSVValue(null)).toBe('');
      expect(escapeCSVValue(undefined)).toBe('');
    });
  });

  describe('validateRoundTrip', () => {
    it('should validate successful round-trip', () => {
      const data = [
        { Name: 'John', Age: 30, City: 'NYC' },
        { Name: 'Jane', Age: 25, City: 'LA' }
      ];

      const isValid = validateRoundTrip(data);

      expect(isValid).toBe(true);
    });

    it('should handle empty array', () => {
      const data = [];
      const isValid = validateRoundTrip(data);

      expect(isValid).toBe(true);
    });

    it('should handle special characters', () => {
      const data = [
        { Name: 'José', City: 'São Paulo' },
        { Name: 'Müller', City: 'München' }
      ];

      const isValid = validateRoundTrip(data);

      expect(isValid).toBe(true);
    });
  });
});
