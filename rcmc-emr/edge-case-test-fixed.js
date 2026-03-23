/**
 * Test edge cases that might bypass the type guard (fixed version)
 */

/**
 * Parse Age/Sex field (format: "25/M", "30/F", "45 / M")
 * 
 * @param {string} value - Age/Sex value to parse
 * @returns {Object|null} Parsed age and sex, or null if invalid
 */
function parseAgeSex(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Pattern: number / M or F (with optional whitespace)
  const pattern = /^(\d+)\s*\/\s*([MF])$/i;
  const match = value.trim().match(pattern);

  if (!match) {
    return null;
  }

  const age = parseInt(match[1], 10);
  const sex = match[2].toUpperCase();

  // Validate age range
  if (age < 0 || age > 150) {
    return null;
  }

  return {
    age,
    sex
  };
}

// Safe JSON stringify that handles BigInt and other special types
function safeStringify(value) {
  try {
    if (typeof value === 'bigint') {
      return `${value}n`;
    }
    if (typeof value === 'symbol') {
      return value.toString();
    }
    if (typeof value === 'function') {
      return '[Function]';
    }
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
}

console.log('=== Testing Edge Cases That Might Bypass Type Guard ===\n');

const edgeCases = [
  // Standard cases that should be caught
  { input: null, description: 'null' },
  { input: undefined, description: 'undefined' },
  { input: 25, description: 'number 25' },
  { input: 0, description: 'number 0' },
  { input: NaN, description: 'NaN' },
  { input: {}, description: 'empty object' },
  { input: [], description: 'empty array' },
  { input: true, description: 'boolean true' },
  { input: false, description: 'boolean false' },
  
  // String objects (not primitive strings) - THIS MIGHT BE THE BUG!
  { input: new String('25/M'), description: 'String object "25/M"' },
  { input: new String(''), description: 'String object empty' },
  { input: new String('25'), description: 'String object "25"' },
  
  // Valid string cases
  { input: '', description: 'empty string' },
  { input: '25/M', description: 'valid string "25/M"' },
  { input: '30 / F', description: 'valid string with spaces' }
];

let bugFound = false;
let counterExamples = [];

edgeCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  Input: ${safeStringify(testCase.input)} (${typeof testCase.input})`);
  
  // Check if it's a String object
  if (testCase.input instanceof String) {
    console.log(`  ⚠️  This is a String OBJECT, not a primitive string!`);
    console.log(`  typeof check: typeof value !== 'string' = ${typeof testCase.input !== 'string'}`);
    console.log(`  !value check: !value = ${!testCase.input}`);
  }
  
  try {
    const result = parseAgeSex(testCase.input);
    console.log(`  ✓ Result: ${safeStringify(result)}`);
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    
    if (error.message.includes('trim is not a function')) {
      console.log(`  🐛 BUG FOUND: ${error.message}`);
      bugFound = true;
      counterExamples.push({
        input: testCase.input,
        description: testCase.description,
        error: error.message
      });
    }
  }
  
  console.log('');
});

console.log('=== String Object Investigation ===');
console.log('String objects vs primitive strings:');

const stringObj = new String('25/M');
const stringPrimitive = '25/M';

console.log(`String object: ${safeStringify(stringObj)} (${typeof stringObj})`);
console.log(`String primitive: ${safeStringify(stringPrimitive)} (${typeof stringPrimitive})`);
console.log(`String object instanceof String: ${stringObj instanceof String}`);
console.log(`String primitive instanceof String: ${stringPrimitive instanceof String}`);
console.log(`typeof stringObj !== 'string': ${typeof stringObj !== 'string'}`);
console.log(`typeof stringPrimitive !== 'string': ${typeof stringPrimitive !== 'string'}`);

console.log('\n=== Manual Test of Potential Bug ===');
console.log('Testing if String objects can bypass the type guard...');

try {
  // Test with String object that has a trim method
  const stringObject = new String('25/M');
  console.log(`Testing parseAgeSex with String object: ${safeStringify(stringObject)}`);
  console.log(`Type: ${typeof stringObject}`);
  console.log(`Has trim method: ${typeof stringObject.trim === 'function'}`);
  
  // This should be caught by typeof check, but let's see
  const result = parseAgeSex(stringObject);
  console.log(`Result: ${safeStringify(result)}`);
  
} catch (error) {
  console.log(`Error: ${error.message}`);
  if (error.message.includes('trim is not a function')) {
    console.log('🐛 FOUND THE BUG! String objects bypass the type guard!');
  }
}

console.log('\n=== Summary ===');
if (bugFound) {
  console.log('✅ BUG REPRODUCED!');
  console.log('\nCounterexamples found:');
  counterExamples.forEach((example, index) => {
    console.log(`  ${index + 1}. ${example.description}`);
    console.log(`     Input: ${safeStringify(example.input)}`);
    console.log(`     Error: ${example.error}`);
  });
} else {
  console.log('❓ No bugs found - the type guard is working correctly');
  console.log('The current implementation appears to handle all edge cases properly');
}