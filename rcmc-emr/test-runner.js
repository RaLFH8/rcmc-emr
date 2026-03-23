/**
 * Simple test runner to execute the parseAgeSex function and demonstrate the bug
 */

import { parseAgeSex } from './src/utils/import/patientFieldParser.js';

console.log('=== Bug Condition Exploration Test ===');
console.log('Testing parseAgeSex function with non-string values...\n');

const testCases = [
  { input: null, description: 'null value' },
  { input: undefined, description: 'undefined value' },
  { input: 25, description: 'number value' },
  { input: {}, description: 'object value' },
  { input: [], description: 'array value' },
  { input: true, description: 'boolean value' }
];

let bugConfirmed = false;
let counterExamples = [];

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: parseAgeSex(${JSON.stringify(testCase.input)}) - ${testCase.description}`);
  
  try {
    const result = parseAgeSex(testCase.input);
    console.log(`  ✓ Result: ${JSON.stringify(result)}`);
    
    // After fix, all these should return null
    if (result !== null) {
      console.log(`  ⚠️  Expected null but got: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    
    // Check if this is the specific bug we're looking for
    if (error.message.includes('trim is not a function')) {
      console.log(`  🐛 BUG CONFIRMED: ${error.message}`);
      bugConfirmed = true;
      counterExamples.push({
        input: testCase.input,
        description: testCase.description,
        error: error.message
      });
    }
  }
  
  console.log('');
});

console.log('=== Test Summary ===');
if (bugConfirmed) {
  console.log('✅ BUG CONDITION CONFIRMED: "ageSex.trim is not a function" error occurs with non-string values');
  console.log('\nCounterexamples found:');
  counterExamples.forEach((example, index) => {
    console.log(`  ${index + 1}. Input: ${JSON.stringify(example.input)} (${example.description})`);
    console.log(`     Error: ${example.error}`);
  });
  
  console.log('\n🎯 ROOT CAUSE: The type guard in parseAgeSex is not preventing .trim() from being called on non-string values');
  console.log('📋 EXPECTED BEHAVIOR: All non-string inputs should return null without throwing errors');
  console.log('🔧 NEXT STEP: Implement fix to strengthen type guard and handle non-string values properly');
} else {
  console.log('❓ Bug condition not reproduced - all tests passed');
  console.log('This could mean:');
  console.log('  1. The bug has already been fixed');
  console.log('  2. The bug occurs under different conditions');
  console.log('  3. The test setup needs adjustment');
}

console.log('\n=== Valid String Format Tests (Preservation Check) ===');
const validTestCases = [
  { input: "25/M", expected: { age: 25, sex: "M" } },
  { input: "30 / F", expected: { age: 30, sex: "F" } },
  { input: "45/m", expected: { age: 45, sex: "M" } },
  { input: "25M", expected: null },
  { input: "200/M", expected: null },
  { input: "", expected: null }
];

validTestCases.forEach((testCase, index) => {
  console.log(`Valid Test ${index + 1}: parseAgeSex("${testCase.input}")`);
  
  try {
    const result = parseAgeSex(testCase.input);
    console.log(`  ✓ Result: ${JSON.stringify(result)}`);
    
    // Check if result matches expected
    if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
      console.log(`  ✅ Matches expected: ${JSON.stringify(testCase.expected)}`);
    } else {
      console.log(`  ⚠️  Expected: ${JSON.stringify(testCase.expected)}, Got: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.log(`  ❌ Unexpected error: ${error.message}`);
  }
  
  console.log('');
});