/**
 * Reproduce the actual bug condition by simulating CSV parsing with dynamicTyping
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

console.log('=== Reproducing the Real Bug Condition ===');
console.log('Simulating CSV parsing with dynamicTyping: true (Papa Parse behavior)\n');

// Simulate what happens when Papa Parse processes CSV data with dynamicTyping: true
const csvRowSimulations = [
  {
    description: 'CSV cell with just number "25" gets parsed as number 25',
    originalCSV: '"25"',
    parsedValue: 25,  // Papa Parse converts this to number
    expectedBehavior: 'Should handle gracefully and return null'
  },
  {
    description: 'CSV cell with "null" gets parsed as null',
    originalCSV: 'null',
    parsedValue: null,  // Papa Parse converts this to null
    expectedBehavior: 'Should handle gracefully and return null'
  },
  {
    description: 'CSV cell with empty value gets parsed as empty string',
    originalCSV: '""',
    parsedValue: '',  // Papa Parse keeps this as empty string
    expectedBehavior: 'Should handle gracefully and return null'
  },
  {
    description: 'CSV cell with boolean "true" gets parsed as boolean',
    originalCSV: 'true',
    parsedValue: true,  // Papa Parse converts this to boolean
    expectedBehavior: 'Should handle gracefully and return null'
  },
  {
    description: 'CSV cell with valid age/sex format stays as string',
    originalCSV: '"25/M"',
    parsedValue: '25/M',  // Papa Parse keeps this as string
    expectedBehavior: 'Should parse correctly to {age: 25, sex: "M"}'
  }
];

let bugReproduced = false;
let counterExamples = [];

csvRowSimulations.forEach((simulation, index) => {
  console.log(`Simulation ${index + 1}: ${simulation.description}`);
  console.log(`  Original CSV: ${simulation.originalCSV}`);
  console.log(`  Parsed Value: ${JSON.stringify(simulation.parsedValue)} (${typeof simulation.parsedValue})`);
  console.log(`  Expected: ${simulation.expectedBehavior}`);
  
  try {
    // This is what happens in parsePatientImportRow:
    // const ageSex = parseAgeSex(row.age_sex || row['Age/Sex'] || '');
    // If row.age_sex is a number (25), then row.age_sex || '' returns 25 (the number)
    const inputToParseAgeSex = simulation.parsedValue || '';
    console.log(`  Input to parseAgeSex: ${JSON.stringify(inputToParseAgeSex)} (${typeof inputToParseAgeSex})`);
    
    const result = parseAgeSex(inputToParseAgeSex);
    console.log(`  ✓ Result: ${JSON.stringify(result)}`);
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    
    if (error.message.includes('trim is not a function')) {
      console.log(`  🐛 BUG REPRODUCED: ${error.message}`);
      bugReproduced = true;
      counterExamples.push({
        simulation: simulation.description,
        input: simulation.parsedValue,
        error: error.message
      });
    }
  }
  
  console.log('');
});

console.log('=== Bug Reproduction Summary ===');
if (bugReproduced) {
  console.log('✅ BUG SUCCESSFULLY REPRODUCED!');
  console.log('\nRoot Cause Confirmed:');
  console.log('  1. Papa Parse with dynamicTyping: true converts numeric CSV values to JavaScript numbers');
  console.log('  2. When parseAgeSex receives a number instead of a string, the type guard fails');
  console.log('  3. The .trim() method is called on a number, causing "trim is not a function" error');
  
  console.log('\nCounterexamples:');
  counterExamples.forEach((example, index) => {
    console.log(`  ${index + 1}. ${example.simulation}`);
    console.log(`     Input: ${JSON.stringify(example.input)}`);
    console.log(`     Error: ${example.error}`);
  });
} else {
  console.log('❓ Bug not reproduced in this simulation');
  console.log('The current type guard appears to be working correctly');
}

console.log('\n=== Testing the Actual Bug Scenario ===');
console.log('Direct test with number input (what Papa Parse would produce):');

try {
  // This is the exact scenario: Papa Parse converts "25" to number 25
  const numberInput = 25;
  console.log(`Testing parseAgeSex(${numberInput}) where input is a number...`);
  
  const result = parseAgeSex(numberInput);
  console.log(`Result: ${JSON.stringify(result)}`);
  console.log('✓ No error - type guard is working correctly');
  
} catch (error) {
  console.log(`❌ ERROR: ${error.message}`);
  if (error.message.includes('trim is not a function')) {
    console.log('🐛 BUG CONFIRMED: The type guard is not preventing .trim() on numbers');
  }
}

console.log('\n=== Analysis ===');
console.log('The current type guard `if (!value || typeof value !== "string")` should catch:');
console.log('  - null: !null is true → returns null ✓');
console.log('  - undefined: !undefined is true → returns null ✓');
console.log('  - 0: !0 is true → returns null ✓');
console.log('  - false: !false is true → returns null ✓');
console.log('  - "": !"" is true → returns null ✓');
console.log('  - 25: !25 is false, but typeof 25 !== "string" is true → returns null ✓');
console.log('  - {}: !{} is false, but typeof {} !== "string" is true → returns null ✓');
console.log('  - []: ![] is false, but typeof [] !== "string" is true → returns null ✓');

console.log('\nConclusion: The type guard logic appears correct and should prevent the bug.');
console.log('This suggests either:');
console.log('  1. The bug has already been fixed');
console.log('  2. The bug occurs in a different version of the code');
console.log('  3. There are additional conditions that trigger the bug');
console.log('  4. The bug report may be based on outdated information');