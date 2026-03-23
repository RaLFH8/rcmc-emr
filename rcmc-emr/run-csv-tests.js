#!/usr/bin/env node

// Simple test runner for CSV parsing tests
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running CSV Parsing Tests...\n');

try {
  // Run the bug exploration test
  console.log('📋 Running Bug Condition Exploration Test...');
  execSync('node_modules/.bin/vitest run src/tests/import/csv-parsing-loading-bug-exploration.test.js', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\n📋 Running Preservation Property Tests...');
  execSync('node_modules/.bin/vitest run src/tests/import/csv-parsing-loading-preservation.test.js', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\n✅ All CSV parsing tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
}