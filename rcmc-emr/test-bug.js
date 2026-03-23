// Simple test to verify the ageSex.trim bug
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
  { input: '25/M', description: 'valid string format' }
];

testCases.forEach(({ input, description }) => {
  console.log(`Testing ${description}: ${JSON.stringify(input)}`);
  
  try {
    const result = parseAgeSex(input);
    console.log(`  ✓ Result: ${JSON.stringify(result)}`);
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    if (error.message.includes('trim is not a function')) {
      console.log(`  🐛 BUG CONFIRMED: ${description} causes trim error`);
    }
  }
  
  console.log('');
});