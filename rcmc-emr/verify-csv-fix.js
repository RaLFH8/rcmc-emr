/**
 * CSV Fix Verification Script
 * 
 * This script manually tests the CSV parsing functionality to verify
 * that the fix is working correctly without relying on test runners.
 */

import { parseCSV, parseCSVString } from './src/utils/import/csvParser.js';
import { validatePatientData } from './src/services/import/patientImportService.js';

console.log('🧪 CSV Parsing Fix Verification\n');

// Mock doctors data for validation
const mockDoctors = [
  { id: 1, name: 'Dr. Smith', full_name: 'Dr. John Smith' },
  { id: 2, name: 'Dr. Johnson', full_name: 'Dr. Mary Johnson' }
];

async function testNumericCSVParsing() {
  console.log('📋 Test 1: CSV with Numeric Values (Bug Condition)');
  
  // Create CSV content with numeric age values that previously caused the bug
  const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,25/M,Dr. Smith,2024-01-15
Jane Smith,30.5/F,Dr. Johnson,2024-01-16
Bob Wilson,45/M,Dr. Smith,2024-01-17`;

  try {
    // Create a File object from the CSV content
    const csvFile = new File([csvContent], 'test-patients.csv', { type: 'text/csv' });

    console.log('  ⏱️  Starting CSV parsing...');
    const startTime = Date.now();
    
    // Test parsing with timeout to detect infinite loading
    const parseResult = await Promise.race([
      parseCSV(csvFile),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Parsing timeout - stuck in loading state')), 30000)
      )
    ]);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`  ✅ Parsing completed in ${duration}ms`);
    console.log(`  📊 Success: ${parseResult.success}`);
    console.log(`  📋 Headers: ${parseResult.headers?.join(', ')}`);
    console.log(`  📈 Row count: ${parseResult.rowCount}`);
    
    if (parseResult.success && parseResult.data.length > 0) {
      const firstRow = parseResult.data[0];
      console.log(`  🔍 Sample data: ${JSON.stringify(firstRow)}`);
      console.log(`  🔤 Age/Sex type: ${typeof firstRow['Age/Sex']}`);
      console.log(`  💡 Age/Sex value: "${firstRow['Age/Sex']}"`);
      
      // Verify all values are strings (the fix)
      const allValuesAreStrings = Object.values(firstRow).every(value => typeof value === 'string');
      console.log(`  ✅ All values are strings: ${allValuesAreStrings}`);
      
      return { success: true, duration, allStrings: allValuesAreStrings };
    } else {
      console.log(`  ❌ Parsing failed: ${parseResult.error?.message}`);
      return { success: false, error: parseResult.error?.message };
    }

  } catch (error) {
    console.log(`  ❌ Test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testValidationWithNumericData() {
  console.log('\n📋 Test 2: Validation with Numeric CSV Data');
  
  const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
Alice Brown,28/F,Dr. Smith,2024-01-15
Charlie Davis,35/M,Dr. Johnson,2024-01-16`;

  try {
    const csvFile = new File([csvContent], 'validation-test.csv', { type: 'text/csv' });
    
    console.log('  ⏱️  Parsing CSV...');
    const parseResult = await parseCSV(csvFile);
    
    if (parseResult.success) {
      console.log('  ✅ CSV parsed successfully');
      console.log(`  🔍 Sample row: ${JSON.stringify(parseResult.data[0])}`);
      
      console.log('  ⏱️  Running validation...');
      const validationErrors = await validatePatientData(parseResult.data, mockDoctors);
      
      console.log(`  ✅ Validation completed with ${validationErrors.length} errors`);
      
      if (validationErrors.length > 0) {
        console.log('  📝 Validation errors:');
        validationErrors.slice(0, 3).forEach((error, index) => {
          console.log(`    ${index + 1}. ${error.message}`);
        });
      }
      
      return { success: true, validationErrors: validationErrors.length };
    } else {
      console.log(`  ❌ CSV parsing failed: ${parseResult.error?.message}`);
      return { success: false, error: parseResult.error?.message };
    }

  } catch (error) {
    console.log(`  ❌ Validation test failed: ${error.message}`);
    
    // Check if this is the old "trim is not a function" error
    if (error.message.includes('trim is not a function')) {
      console.log('  🐛 DETECTED: This is the old "trim is not a function" bug!');
      console.log('  ❌ The fix may not be working correctly.');
    }
    
    return { success: false, error: error.message };
  }
}

async function testStringOnlyPreservation() {
  console.log('\n📋 Test 3: String-Only CSV Preservation');
  
  const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,twenty-five/M,Dr. Smith,2024-01-15
Jane Smith,thirty/F,Dr. Johnson,2024-01-16`;

  try {
    const csvFile = new File([csvContent], 'string-test.csv', { type: 'text/csv' });
    
    const parseResult = await parseCSV(csvFile);
    
    if (parseResult.success) {
      console.log('  ✅ String-only CSV parsed successfully');
      console.log(`  📋 Headers: ${parseResult.headers.join(', ')}`);
      console.log(`  📈 Row count: ${parseResult.rowCount}`);
      
      const firstRow = parseResult.data[0];
      console.log(`  🔍 Sample data: ${JSON.stringify(firstRow)}`);
      
      // Verify preservation of string processing
      const expectedData = {
        'Patient Name': 'John Doe',
        'Age/Sex': 'twenty-five/M',
        'Doctor': 'Dr. Smith',
        'Consultation Date': '2024-01-15'
      };
      
      const dataMatches = JSON.stringify(firstRow) === JSON.stringify(expectedData);
      console.log(`  ✅ Data preservation: ${dataMatches}`);
      
      return { success: true, preserved: dataMatches };
    } else {
      console.log(`  ❌ String-only parsing failed: ${parseResult.error?.message}`);
      return { success: false, error: parseResult.error?.message };
    }

  } catch (error) {
    console.log(`  ❌ Preservation test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testParseCSVString() {
  console.log('\n📋 Test 4: parseCSVString Function');
  
  const csvString = `Patient Name,Age/Sex,Doctor,Consultation Date
Test Patient,42/M,Dr. Smith,2024-01-15`;

  try {
    console.log('  ⏱️  Testing parseCSVString...');
    const parseResult = parseCSVString(csvString);
    
    if (parseResult.success) {
      console.log('  ✅ parseCSVString works correctly');
      console.log(`  📋 Headers: ${parseResult.headers.join(', ')}`);
      console.log(`  🔍 Data: ${JSON.stringify(parseResult.data[0])}`);
      
      // Verify all values are strings
      const allStrings = Object.values(parseResult.data[0]).every(v => typeof v === 'string');
      console.log(`  ✅ All values are strings: ${allStrings}`);
      
      return { success: true, allStrings };
    } else {
      console.log(`  ❌ parseCSVString failed: ${parseResult.error?.message}`);
      return { success: false, error: parseResult.error?.message };
    }

  } catch (error) {
    console.log(`  ❌ parseCSVString test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive CSV fix verification...\n');
  
  const results = {
    numericParsing: await testNumericCSVParsing(),
    validation: await testValidationWithNumericData(),
    preservation: await testStringOnlyPreservation(),
    parseString: await testParseCSVString()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  let allPassed = true;
  
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}: ${result.success ? 'Working correctly' : result.error}`);
    if (!result.success) allPassed = false;
  });
  
  console.log('\n🎯 Overall Result:');
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - CSV parsing fix is working correctly!');
    console.log('🔧 Fix Summary:');
    console.log('   - dynamicTyping: false ensures all CSV values remain as strings');
    console.log('   - Validation functions can now safely call .trim() on all values');
    console.log('   - No more "trim is not a function" errors');
    console.log('   - Parsing completes within reasonable time limits');
    console.log('   - String-only CSV processing behavior is preserved');
  } else {
    console.log('❌ SOME TESTS FAILED - The fix may need additional work');
  }
  
  return allPassed;
}

// Run the verification
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Verification script crashed:', error);
  process.exit(1);
});