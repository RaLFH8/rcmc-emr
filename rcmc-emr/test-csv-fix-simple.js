/**
 * Simple CSV Parsing Fix Test
 * 
 * Tests the core functionality to verify the dynamicTyping fix is working.
 */

import { parseCSVString } from './src/utils/import/csvParser.js';
import { parseAgeSex } from './src/utils/import/patientFieldParser.js';

console.log('🧪 Simple CSV Parsing Fix Test');
console.log('==============================\n');

// Test 1: parseAgeSex with non-string values (the root cause of the bug)
console.log('📋 Test 1: parseAgeSex with non-string values');
console.log('----------------------------------------------');

const testCases = [
  { input: null, description: 'null value' },
  { input: undefined, description: 'undefined value' },
  { input: 25, description: 'number value' },
  { input: true, description: 'boolean value' },
  { input: {}, description: 'object value' },
  { input: [], description: 'array value' },
  { input: '25/M', description: 'valid string value' }
];

let parseAgeSexPassed = true;
testCases.forEach(({ input, description }) => {
  try {
    const result = parseAgeSex(input);
    console.log(`✅ ${description}: ${JSON.stringify(result)}`);
  } catch (error) {
    console.log(`❌ ${description}: ERROR - ${error.message}`);
    if (error.message.includes('trim is not a function')) {
      console.log('🐛 CRITICAL: "trim is not a function" bug still exists!');
    }
    parseAgeSexPassed = false;
  }
});

// Test 2: CSV parsing with numeric values
console.log('\n📋 Test 2: CSV parsing with numeric values');
console.log('-------------------------------------------');

const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,25/M,Dr. Smith,2024-01-15
Jane Smith,30.5/F,Dr. Johnson,2024-01-16`;

let csvParsingPassed = true;
try {
  const startTime = Date.now();
  const parseResult = parseCSVString(csvContent);
  const duration = Date.now() - startTime;
  
  console.log(`⏱️  Parsing completed in ${duration}ms`);
  
  if (parseResult.success) {
    console.log('✅ CSV parsing succeeded');
    console.log(`📊 Parsed ${parseResult.rowCount} rows`);
    
    // Check data types
    const firstRow = parseResult.data[0];
    console.log('\n🔍 Data type analysis:');
    Object.entries(firstRow).forEach(([key, value]) => {
      console.log(`  ${key}: "${value}" (${typeof value})`);
    });
    
    // Verify all values are strings (dynamicTyping disabled)
    const allStrings = Object.values(firstRow).every(value => typeof value === 'string');
    if (allStrings) {
      console.log('✅ All values are strings (dynamicTyping properly disabled)');
    } else {
      console.log('❌ Some values are not strings (dynamicTyping may still be active)');
      csvParsingPassed = false;
    }
  } else {
    console.log('❌ CSV parsing failed:', parseResult.error.message);
    csvParsingPassed = false;
  }
} catch (error) {
  console.log('❌ CSV parsing error:', error.message);
  csvParsingPassed = false;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST RESULTS');
console.log('='.repeat(50));
console.log(`parseAgeSex non-string handling: ${parseAgeSexPassed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`CSV parsing with numeric values: ${csvParsingPassed ? '✅ PASSED' : '❌ FAILED'}`);

const allPassed = parseAgeSexPassed && csvParsingPassed;
console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));

if (allPassed) {
  console.log('✅ CSV parsing hanging bug has been FIXED');
  console.log('✅ dynamicTyping has been properly disabled');
  console.log('✅ Non-string value handling is working correctly');
} else {
  console.log('❌ The fix may not be complete');
}

console.log('='.repeat(50));

process.exit(allPassed ? 0 : 1);