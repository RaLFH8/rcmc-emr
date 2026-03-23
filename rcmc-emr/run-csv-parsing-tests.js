#!/usr/bin/env node

/**
 * CSV Parsing Tests Runner
 * 
 * Runs the specific CSV parsing bug exploration and preservation tests
 * to verify the fix is working correctly.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running CSV Parsing Tests...\n');

// Test files to run
const testFiles = [
  'src/tests/import/csv-parsing-loading-bug-exploration.test.js',
  'src/tests/import/csv-parsing-loading-preservation.test.js'
];

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 Running: ${testFile}`);
    console.log('=' .repeat(60));
    
    const testProcess = spawn('npx', ['vitest', 'run', testFile], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} - PASSED`);
        resolve(true);
      } else {
        console.log(`❌ ${testFile} - FAILED (exit code: ${code})`);
        resolve(false);
      }
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Error running ${testFile}:`, error.message);
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting CSV Parsing Test Suite');
  console.log('Testing the fix for CSV parsing hanging bug\n');
  
  const results = [];
  
  for (const testFile of testFiles) {
    const result = await runTest(testFile);
    results.push({ testFile, passed: result });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  let allPassed = true;
  results.forEach(({ testFile, passed }) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${testFile}`);
    if (!passed) allPassed = false;
  });
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! CSV parsing fix is working correctly.');
    console.log('✅ Bug condition exploration test: PASSED (bug is fixed)');
    console.log('✅ Preservation tests: PASSED (no regressions)');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
  }
  console.log('='.repeat(60));
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});