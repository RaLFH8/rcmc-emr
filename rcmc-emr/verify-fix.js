// Verify the parseAgeSex fix is working
import { parseAgeSex } from './src/utils/import/patientFieldParser.js';

console.log('Testing parseAgeSex with different input types...\n');

const testCases = [
  { input: null, description: 'null value' },
  { input: undefined, description: 'undefined value' },
  { input: 25, description: 'number value' },
  { input: {}, description: 'object value' },
  { input: [], description: 'array value' },
  { input: true, description: 'boolean value' },
  { input: '', description: 'empty string' },
  { input: '25/M', description: 'valid string format' },
  { input: '30 / F', description: 'valid string with spaces' },
  { input: '45/m', description: 'valid string lowercase' },
  { input: '25M', description: 'invalid format (no slash)' },
  { input: '200/M', description: 'invalid age (out of range)' }
];

let passCount = 0;
let failCount = 0;

testCases.forEach(({ input, description }) => {
  console.log(`Testing ${description}: ${JSON.stringify(input)}`);
  
  try {
    const result = parseAgeSex(input);
    console.log(`  ✓ Result: ${JSON.stringify(result)}`);
    
    // Verify expected behavior
    if (input === null || input === undefined || typeof input !== 'string' || input === '') {
      if (result === null) {
        console.log(`  ✓ PASS: Correctly returned null for non-string/empty input`);
        passCount++;
      } else {
        console.log(`  ✗ FAIL: Expected null but got ${JSON.stringify(result)}`);
        failCount++;
      }
    } else if (typeof input === 'string') {
      // Valid string formats should parse correctly
      if (input === '25/M') {
        if (result && result.age === 25 && result.sex === 'M') {
          console.log(`  ✓ PASS: Correctly parsed valid format`);
          passCount++;
        } else {
          console.log(`  ✗ FAIL: Expected {age: 25, sex: 'M'} but got ${JSON.stringify(result)}`);
          failCount++;
        }
      } else if (input === '30 / F') {
        if (result && result.age === 30 && result.sex === 'F') {
          console.log(`  ✓ PASS: Correctly parsed format with spaces`);
          passCount++;
        } else {
          console.log(`  ✗ FAIL: Expected {age: 30, sex: 'F'} but got ${JSON.stringify(result)}`);
          failCount++;
        }
      } else if (input === '45/m') {
        if (result && result.age === 45 && result.sex === 'M') {
          console.log(`  ✓ PASS: Correctly normalized lowercase sex`);
          passCount++;
        } else {
          console.log(`  ✗ FAIL: Expected {age: 45, sex: 'M'} but got ${JSON.stringify(result)}`);
          failCount++;
        }
      } else {
        // Invalid formats should return null
        if (result === null) {
          console.log(`  ✓ PASS: Correctly returned null for invalid format`);
          passCount++;
        } else {
          console.log(`  ✗ FAIL: Expected null for invalid format but got ${JSON.stringify(result)}`);
          failCount++;
        }
      }
    }
    
  } catch (error) {
    console.log(`  ✗ ERROR: ${error.message}`);
    if (error.message.includes('trim is not a function')) {
      console.log(`  🐛 BUG STILL EXISTS: ${description} causes trim error`);
    }
    failCount++;
  }
  
  console.log('');
});

console.log('--- Test Summary ---');
console.log(`✓ Passed: ${passCount}`);
console.log(`✗ Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount === 0) {
  console.log('\n🎉 ALL TESTS PASSED! The ageSex.trim bug has been fixed.');
} else {
  console.log('\n❌ Some tests failed. The bug may still exist or there are other issues.');
}