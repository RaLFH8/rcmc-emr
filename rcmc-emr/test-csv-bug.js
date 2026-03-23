/**
 * Simple test script to demonstrate the CSV parsing bug
 * This script reproduces the bug condition without requiring vitest
 */

import { parseCSV } from './src/utils/import/csvParser.js';

// Create a CSV file with numeric values that trigger dynamicTyping
const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,25/M,Dr. Smith,2024-01-15
Jane Smith,30.5/F,Dr. Johnson,2024-01-16
Bob Wilson,45/M,Dr. Smith,2024-01-17`;

console.log('🧪 Testing CSV parsing with numeric values...');
console.log('📄 CSV Content:');
console.log(csvContent);
console.log('\n⏱️  Starting parse test...');

// Create a File-like object for testing
const csvFile = new File([csvContent], 'test-patients.csv', { type: 'text/csv' });

const startTime = Date.now();

try {
  const parseResult = await Promise.race([
    parseCSV(csvFile),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT: Parsing stuck in loading state')), 30000)
    )
  ]);

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`✅ Parsing completed in ${duration}ms`);
  
  if (parseResult.success) {
    console.log('📊 Parse Result:');
    console.log('- Success:', parseResult.success);
    console.log('- Row count:', parseResult.rowCount);
    console.log('- Headers:', parseResult.headers);
    console.log('\n🔍 Sample data (first row):');
    console.log(parseResult.data[0]);
    
    // Check the data types - this is where we see the dynamicTyping effect
    console.log('\n🧬 Data type analysis:');
    const firstRow = parseResult.data[0];
    for (const [key, value] of Object.entries(firstRow)) {
      console.log(`- ${key}: "${value}" (type: ${typeof value})`);
    }
    
    // Test if Age/Sex is a number (which would cause the trim bug)
    const ageSex = firstRow['Age/Sex'];
    console.log(`\n🎯 Age/Sex value: "${ageSex}" (type: ${typeof ageSex})`);
    
    if (typeof ageSex === 'number') {
      console.log('🐛 BUG CONDITION DETECTED: Age/Sex is a number due to dynamicTyping!');
      console.log('💥 This will cause "trim is not a function" error in validation');
      
      // Simulate the validation error
      try {
        ageSex.trim(); // This will fail
      } catch (error) {
        console.log('🔥 CONFIRMED ERROR:', error.message);
      }
    } else {
      console.log('✅ Age/Sex is a string, no trim error expected');
    }
    
  } else {
    console.log('❌ Parse failed:', parseResult.error.message);
  }

} catch (error) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`💥 ERROR after ${duration}ms:`, error.message);
  
  if (error.message.includes('TIMEOUT')) {
    console.log('🐛 BUG CONFIRMED: Parsing got stuck in infinite loading state');
  }
}

console.log('\n📋 Test Summary:');
console.log('- This test demonstrates the CSV parsing bug condition');
console.log('- dynamicTyping: true converts "25/M" to number 25 (invalid)');
console.log('- Validation functions expect strings and call .trim()');
console.log('- Calling .trim() on numbers throws "trim is not a function"');
console.log('- This causes parsing to hang or fail with runtime errors');