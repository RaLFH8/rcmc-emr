/**
 * CSV Parser Unit Tests for Revenue Insights
 * Tests for parseToCSV, escapeCSVField, parseFromCSV, and parseCSVLine functions
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { parseToCSV, escapeCSVField, parseFromCSV, parseCSVLine } from '../utils/csvParser.js';

describe('CSV Parser for Revenue Insights', () => {
  describe('escapeCSVField', () => {
    it('should not escape simple values', () => {
      expect(escapeCSVField('Emergency')).toBe('Emergency');
      expect(escapeCSVField('Cardiology')).toBe('Cardiology');
    });

    it('should escape fields containing commas', () => {
      expect(escapeCSVField('Emergency, Urgent Care')).toBe('"Emergency, Urgent Care"');
    });

    it('should escape fields containing quotes', () => {
      expect(escapeCSVField('Dr. "John" Smith')).toBe('"Dr. ""John"" Smith"');
    });

    it('should escape fields containing newlines', () => {
      expect(escapeCSVField('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });

    it('should escape fields with multiple special characters', () => {
      expect(escapeCSVField('Department "A", Room\n5')).toBe('"Department ""A"", Room\n5"');
    });

    it('should handle non-string values', () => {
      expect(escapeCSVField(123)).toBe(123);
      expect(escapeCSVField(null)).toBe(null);
      expect(escapeCSVField(undefined)).toBe(undefined);
    });
  });

  describe('parseToCSV', () => {
    it('should generate CSV with headers and data rows', () => {
      const data = [
        { name: 'Emergency', value: 125000, percentage: 35.5 },
        { name: 'Cardiology', value: 85000, percentage: 24.1 }
      ];
      const totalRevenue = 210000;

      const csv = parseToCSV(data, totalRevenue);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Name,Amount,Percentage');
      expect(lines[1]).toBe('Emergency,125000.00,35.50%');
      expect(lines[2]).toBe('Cardiology,85000.00,24.10%');
      expect(lines[3]).toBe('Total,210000.00,100.00%');
    });

    it('should handle category field instead of name', () => {
      const data = [
        { category: 'Consultations', amount: 85000, percentage: 42.5 }
      ];
      const totalRevenue = 200000;

      const csv = parseToCSV(data, totalRevenue);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('Consultations,85000.00,42.50%');
    });

    it('should escape special characters in names', () => {
      const data = [
        { name: 'Emergency, Urgent Care', value: 125000, percentage: 35.5 }
      ];
      const totalRevenue = 352112.68;

      const csv = parseToCSV(data, totalRevenue);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('"Emergency, Urgent Care",125000.00,35.50%');
    });

    it('should handle missing percentage', () => {
      const data = [
        { name: 'Emergency', value: 125000 }
      ];
      const totalRevenue = 125000;

      const csv = parseToCSV(data, totalRevenue);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('Emergency,125000.00,N/A');
    });
  });

  describe('parseCSVLine', () => {
    it('should parse simple CSV line', () => {
      const line = 'Emergency,125000.00,35.50%';
      const values = parseCSVLine(line);

      expect(values).toEqual(['Emergency', '125000.00', '35.50%']);
    });

    it('should parse quoted fields with commas', () => {
      const line = '"Emergency, Urgent Care",125000.00,35.50%';
      const values = parseCSVLine(line);

      expect(values).toEqual(['Emergency, Urgent Care', '125000.00', '35.50%']);
    });

    it('should parse escaped quotes within quoted fields', () => {
      const line = '"Dr. ""John"" Smith",45000.00,28.50%';
      const values = parseCSVLine(line);

      expect(values).toEqual(['Dr. "John" Smith', '45000.00', '28.50%']);
    });

    it('should parse quoted fields with newlines', () => {
      const line = '"Line 1\nLine 2",100.00,10.00%';
      const values = parseCSVLine(line);

      expect(values).toEqual(['Line 1\nLine 2', '100.00', '10.00%']);
    });

    it('should handle empty fields', () => {
      const line = 'Emergency,,35.50%';
      const values = parseCSVLine(line);

      expect(values).toEqual(['Emergency', '', '35.50%']);
    });
  });

  describe('parseFromCSV', () => {
    it('should parse CSV back to data structure', () => {
      const csv = 'Name,Amount,Percentage\nEmergency,125000.00,35.50%\nCardiology,85000.00,24.10%\nTotal,210000.00,100.00%';
      const data = parseFromCSV(csv);

      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({
        name: 'Emergency',
        amount: 125000,
        percentage: 35.5
      });
      expect(data[1]).toEqual({
        name: 'Cardiology',
        amount: 85000,
        percentage: 24.1
      });
    });

    it('should handle quoted fields in round-trip', () => {
      const csv = 'Name,Amount,Percentage\n"Emergency, Urgent Care",125000.00,35.50%\nTotal,352112.68,100.00%';
      const data = parseFromCSV(csv);

      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Emergency, Urgent Care');
      expect(data[0].amount).toBe(125000);
    });

    it('should handle escaped quotes in round-trip', () => {
      const csv = 'Name,Amount,Percentage\n"Dr. ""John"" Smith",45000.00,28.50%\nTotal,157894.74,100.00%';
      const data = parseFromCSV(csv);

      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('Dr. "John" Smith');
    });
  });

  describe('Round-trip integrity', () => {
    it('should maintain data integrity through export and import', () => {
      const originalData = [
        { name: 'Emergency', value: 125000, percentage: 35.5 },
        { name: 'Cardiology', value: 85000, percentage: 24.1 },
        { name: 'Emergency, Urgent Care', value: 50000, percentage: 14.2 }
      ];
      const totalRevenue = 352112.68;

      // Export to CSV
      const csv = parseToCSV(originalData, totalRevenue);

      // Import back from CSV
      const parsedData = parseFromCSV(csv);

      // Verify data matches (excluding total row)
      expect(parsedData).toHaveLength(originalData.length);
      parsedData.forEach((item, index) => {
        expect(item.name).toBe(originalData[index].name);
        expect(item.amount).toBeCloseTo(originalData[index].value, 2);
        expect(item.percentage).toBeCloseTo(originalData[index].percentage, 2);
      });
    });

    it('should handle special characters in round-trip', () => {
      const originalData = [
        { name: 'Dr. "John" Smith, MD', value: 45000, percentage: 28.5 },
        { name: 'Department\nA', value: 30000, percentage: 19.0 }
      ];
      const totalRevenue = 157894.74;

      const csv = parseToCSV(originalData, totalRevenue);
      const parsedData = parseFromCSV(csv);

      expect(parsedData).toHaveLength(originalData.length);
      expect(parsedData[0].name).toBe('Dr. "John" Smith, MD');
      expect(parsedData[1].name).toBe('Department\nA');
    });
  });
});
