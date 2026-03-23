// Smart Data Integration & UI Refactoring - Test Setup
// File: src/tests/setup.js

import '@testing-library/jest-dom';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Property-based testing configuration
import fc from 'fast-check';

// Configure fast-check for property-based testing
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test as per design
  verbose: true,
  seed: 42, // Fixed seed for reproducible tests
  endOnFailure: true
});

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null })
  })),
  auth: {
    getUser: vi.fn().mockResolvedValue({ 
      data: { 
        user: { 
          id: 'test-user-id', 
          email: 'test@example.com' 
        } 
      }, 
      error: null 
    })
  }
};

// Mock the Supabase module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Mock File API for file upload testing
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + (bit.length || bit.size || 0), 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
  
  text() {
    return Promise.resolve(this.bits.join(''));
  }
};

// Setup and teardown
beforeAll(() => {
  console.log('🧪 Setting up Smart Data Integration tests...');
});

afterAll(() => {
  console.log('🧹 Cleaning up Smart Data Integration tests...');
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// Export test utilities
export { mockSupabaseClient };

// Test data constants
export const TEST_CONSTANTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  BATCH_SIZE: 500,
  MAX_CONCURRENT_IMPORTS: 3,
  SCHEMA_DETECTION_TIMEOUT: 10000, // 10 seconds
  PROCESSING_TIMEOUT: 300000, // 5 minutes
  CONFIDENCE_THRESHOLD: 0.8
};

// Common test assertions
export const assertImportSession = (session) => {
  expect(session).toHaveProperty('id');
  expect(session).toHaveProperty('user_id');
  expect(session).toHaveProperty('file_name');
  expect(session).toHaveProperty('file_size');
  expect(session).toHaveProperty('file_format');
  expect(session).toHaveProperty('data_type');
  expect(session).toHaveProperty('status');
  expect(session).toHaveProperty('created_at');
};

export const assertValidationResult = (result) => {
  expect(result).toHaveProperty('isValid');
  expect(result).toHaveProperty('errors');
  expect(result).toHaveProperty('warnings');
  expect(Array.isArray(result.errors)).toBe(true);
  expect(Array.isArray(result.warnings)).toBe(true);
};

export const assertDetectedSchema = (schema) => {
  expect(schema).toHaveProperty('columns');
  expect(schema).toHaveProperty('dataType');
  expect(schema).toHaveProperty('confidence');
  expect(schema).toHaveProperty('sampleData');
  expect(Array.isArray(schema.columns)).toBe(true);
  expect(Array.isArray(schema.sampleData)).toBe(true);
  expect(schema.confidence).toBeGreaterThanOrEqual(0);
  expect(schema.confidence).toBeLessThanOrEqual(1);
};