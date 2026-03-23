/**
 * Simple CSV parsing test using parseCSVString
 * 
 * This tests the core fix without requiring File objects or browser APIs
 */

import { parseCSVString, validateCSVStructure, getCSVPreview } from './src/utils/import/csvParser.js';

/**
 * Test 1: Bug Condition - CSV with numeric values should parse correctly
 */
function testBugCondition() {
  console.log('\n🧪 Test 1: Bug Condition - CSV with Numeric Values');
  
  try {
    // CSV content with numeric age values that would trigger dynamicTyping conversion
    const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,25/M,Dr. Smith,2024-01-15
Jane Smith,30.5/F,Dr. Johnson,2024-01-16
Bob Wilson,45/M,Dr. Smith,2024-01-17`;

    console.log('📝 Testing CSV with numeric values: 25, 30.5, 45');
    
    const parseResult = parseCSVString(csvContent);

    if (!parseResult.success) {
      throw new Error(`Parsing failed: ${parseResult.error.message}`);
    }

    console.log('✅ Parsing succeeded');
    console.log('📊 Sample data:', parseResult.data[0]);
    console.log('🔍 Age/Sex value type:', typeof parseResult.data[0]['Age/Sex']);
    console.log('🔍 Age/Sex value:', parseResult.data[0]['Age/Sex']);
    
    // Verify all values are strings (the fix - dynamicTyping: false)
    const firstRow = parseResult.data[0];
    for (const [key, value] of Object.entries(firstRow)) {
      if (typeof value !== 'string') {
        throw new Error(`Expected string but got ${typeof value} for field ${key}: ${value}`);
      }
    }
    
    console.log('✅ All values are strings (dynamicTyping disabled)');
    
    // Test that we can call .trim() on all values (this would fail with the bug)
    console.log('🧪 Testing .trim() on all values...');
    for (const row of parseResult.data) {
      for (const [key, value] of Object.entries(row)) {
        try {
          const trimmed = value.trim(); // This would fail if value was a number
          console.log(`  ${key}: "${value}" -> "${trimmed}"`);
        } catch (error) {
          throw new Error(`trim() failed on ${key}: ${value} (${typeof value}) - ${error.message}`);
        }
      }
    }
    
    console.log('✅ All values can be trimmed successfully');
    
    // Verify specific values that were problematic
    const expectedValues = {
      'Age/Sex': ['25/M', '30.5/F', '45/M'], // These should be strings, not numbers
      'Patient Name': ['John Doe', 'Jane Smith', 'Bob Wilson']
    };
    
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      
      // Check Age/Sex values are strings
      const ageSex = row['Age/Sex'];
      if (ageSex !== expectedValues['Age/Sex'][i]) {
        throw new Error(`Age/Sex mismatch at row ${i}: expected "${expectedValues['Age/Sex'][i]}", got "${ageSex}"`);
      }
      
      if (typeof ageSex !== 'string') {
        throw new Error(`Age/Sex should be string but got ${typeof ageSex}: ${ageSex}`);
      }
    }
    
    console.log('✅ Numeric values correctly preserved as strings');
    console.log('✅ Test 1 PASSED: Bug condition resolved');
    return true;

  } catch (error) {
    console.log('❌ Test 1 FAILED:', error.message);
    return false;
  }
}

/**
 * Test 2: Preservation - String-only CSV should work as before
 */
function testPreservation() {
  console.log('\n🧪 Test 2: Preservation - String-Only CSV Processing');
  
  try {
    // CSV content with only string values
    const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,twenty-five/M,Dr. Smith,2024-01-15
Jane Smith,thirty/F,Dr. Johnson,2024-01-16
Bob Wilson,forty-five/M,Dr. Smith,2024-01-17`;

    console.log('📝 Testing CSV with string-only values');
    
    const parseResult = parseCSVString(csvContent);

    if (!parseResult.success) {
      throw new Error(`Parsing failed: ${parseResult.error.message}`);
    }

    console.log('✅ Parsing succeeded');

    // Verify headers
    const expectedHeaders = ['Patient Name', 'Age/Sex', 'Doctor', 'Consultation Date'];
    if (JSON.stringify(parseResult.headers) !== JSON.stringify(expectedHeaders)) {
      throw new Error(`Headers mismatch. Expected: ${expectedHeaders.join(', ')}, Got: ${parseResult.headers.join(', ')}`);
    }

    console.log('✅ Headers correctly detected:', parseResult.headers);

    // Verify data structure
    const expectedFirstRow = {
      'Patient Name': 'John Doe',
      'Age/Sex': 'twenty-five/M',
      'Doctor': 'Dr. Smith',
      'Consultation Date': '2024-01-15'
    };

    if (JSON.stringify(parseResult.data[0]) !== JSON.stringify(expectedFirstRow)) {
      throw new Error('First row data mismatch');
    }

    console.log('✅ Data structure preserved');

    // Verify all values are strings
    for (const row of parseResult.data) {
      for (const [key, value] of Object.entries(row)) {
        if (typeof value !== 'string') {
          throw new Error(`Expected string but got ${typeof value} for field ${key}: ${value}`);
        }
      }
    }

    console.log('✅ All values are strings');

    // Test utility functions
    const preview = getCSVPreview(parseResult, 2);
    if (preview.length !== 2) {
      throw new Error(`Expected 2 preview rows, got ${preview.length}`);
    }

    console.log('✅ Preview functionality works');

    const validationResult = validateCSVStructure(parseResult, ['Patient Name', 'Age/Sex']);
    if (!validationResult.isValid) {
      throw new Error(`Structure validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    console.log('✅ Structure validation works');
    console.log('✅ Test 2 PASSED: Preservation successful');
    return true;

  } catch (error) {
    console.log('❌ Test 2 FAILED:', error.message);
    return false;
  }
}

/**
 * Test 3: Edge cases
 */
function testEdgeCases() {
  console.log('\n🧪 Test 3: Edge Cases');
  
  try {
    // Test empty string
    const emptyResult = parseCSVString('');
    if (emptyResult.success !== false) {
      throw new Error('Empty string should fail parsing');
    }
    console.log('✅ Empty string properly rejected:', emptyResult.error.message);

    // Test headers only
    const headersOnlyResult = parseCSVString('Patient Name,Age/Sex,Doctor');
    if (headersOnlyResult.success !== false) {
      throw new Error('Headers-only should fail parsing');
    }
    console.log('✅ Headers-only properly rejected:', headersOnlyResult.error.message);

    // Test whitespace trimming
    const csvWithWhitespace = `  Patient Name  , Age/Sex , Doctor  
  Alice Brown  , twenty-eight/F , Dr. Smith  `;

    const whitespaceResult = parseCSVString(csvWithWhitespace);
    if (!whitespaceResult.success) {
      throw new Error(`Whitespace CSV failed: ${whitespaceResult.error.message}`);
    }

    // Check trimming
    const expectedHeaders = ['Patient Name', 'Age/Sex', 'Doctor'];
    if (JSON.stringify(whitespaceResult.headers) !== JSON.stringify(expectedHeaders)) {
      throw new Error('Headers not properly trimmed');
    }

    const firstRow = whitespaceResult.data[0];
    if (firstRow['Patient Name'] !== 'Alice Brown' || firstRow['Doctor'] !== 'Dr. Smith') {
      throw new Error('Values not properly trimmed');
    }

    console.log('✅ Whitespace trimming works correctly');
    console.log('✅ Test 3 PASSED: Edge cases handled');
    return true;

  } catch (error) {
    console.log('❌ Test 3 FAILED:', error.message);
    return false;
  }
}

/**
 * Test 4: Specific bug scenario - mixed numeric and string data
 */
function testMixedDataTypes() {
  console.log('\n🧪 Test 4: Mixed Data Types (Critical Bug Scenario)');
  
  try {
    // This is the exact scenario that caused the bug
    const csvContent = `Patient Name,Age/Sex,Doctor,Phone,Weight
John Doe,25/M,Dr. Smith,09123456789,70.5
Jane Smith,thirty/F,Dr. Johnson,09187654321,sixty-five
Bob Wilson,45/M,Dr. Smith,09111111111,80
Alice Brown,28.5/F,Dr. Johnson,09222222222,55.2`;

    console.log('📝 Testing mixed data types: numbers, decimals, strings');
    
    const parseResult = parseCSVString(csvContent);

    if (!parseResult.success) {
      throw new Error(`Parsing failed: ${parseResult.error.message}`);
    }

    console.log('✅ Parsing succeeded');
    
    // Check that ALL values are strings, even those that look like numbers
    const problematicValues = [];
    
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      
      for (const [key, value] of Object.entries(row)) {
        if (typeof value !== 'string') {
          problematicValues.push(`Row ${i+1}, ${key}: ${value} (${typeof value})`);
        }
        
        // Test that we can call string methods on all values
        try {
          value.trim();
          value.toLowerCase();
          value.includes('/');
        } catch (error) {
          throw new Error(`String method failed on ${key}: ${value} - ${error.message}`);
        }
      }
    }
    
    if (problematicValues.length > 0) {
      throw new Error(`Found non-string values: ${problematicValues.join(', ')}`);
    }
    
    console.log('✅ All values are strings, including numeric-looking ones');
    
    // Verify specific values that would have been converted by dynamicTyping
    const row1 = parseResult.data[0];
    console.log('🔍 Row 1 values and types:');
    console.log(`  Age/Sex: "${row1['Age/Sex']}" (${typeof row1['Age/Sex']})`);
    console.log(`  Phone: "${row1['Phone']}" (${typeof row1['Phone']})`);
    console.log(`  Weight: "${row1['Weight']}" (${typeof row1['Weight']})`);
    
    // These should all be strings now
    if (row1['Age/Sex'] !== '25/M') {
      throw new Error(`Age/Sex should be "25/M" but got "${row1['Age/Sex']}"`);
    }
    if (row1['Weight'] !== '70.5') {
      throw new Error(`Weight should be "70.5" but got "${row1['Weight']}"`);
    }
    
    console.log('✅ Numeric values correctly preserved as strings');
    console.log('✅ Test 4 PASSED: Mixed data types handled correctly');
    return true;

  } catch (error) {
    console.log('❌ Test 4 FAILED:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
function runAllTests() {
  console.log('🚀 CSV Parsing Fix Verification');
  console.log('📋 Task 4: Checkpoint - Ensure all tests pass');
  console.log('🔧 Testing dynamicTyping: false fix');
  
  const results = [];
  
  // Run all tests
  results.push(testBugCondition());
  results.push(testPreservation());
  results.push(testEdgeCases());
  results.push(testMixedDataTypes());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ CSV parsing fix is working correctly');
    console.log('✅ dynamicTyping: false prevents numeric conversion');
    console.log('✅ All CSV values remain as strings for consistent validation');
    console.log('✅ Task 4 (Checkpoint - Ensure all tests pass) is COMPLETE');
    return true;
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    return false;
  }
}

// Run the tests
try {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
}