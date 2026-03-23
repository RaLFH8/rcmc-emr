/**
 * CSV Parsing Fix Verification
 * 
 * This script manually tests the CSV parsing functionality to verify
 * that the dynamicTyping fix is working correctly.
 */

import { parseCSV, parseCSVString } from './src/utils/import/csvParser.js';
import { validatePatientData } from './src/services/import/patientImportService.js';

console.log('🧪 CSV Parsing Fix Verification');
console.log('================================\n');

// Mock doctors data for validation
const mockDoctors = [
  { id: 1, name: 'Dr. Smith', full_name: 'Dr. John Smith' },
  { id: 2, name: 'Dr. Johnson', full_name: 'Dr. Mary Johnson' }
];

async function testNumericCSVParsing() {
  console.log('📋 Test 1: CSV with numeric age values (bug condition)');
  console.log('-----------------------------------------------------');
  
  // Create CSV content with numeric age values that previously caused issues
  const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,25/M,Dr. Smith,2024-01-15
Jane Smith,30.5/F,Dr. Johnson,2024-01-16
Bob Wilson,45/M,Dr. Smith,2024-01-17`;

  try {
    const startTime = Date.now();
    
    // Test parseCSVString first (simpler)
    console.log('Testing parseCSVString...');
    const parseResult = parseCSVString(csvContent);
    
    const duration = Date.now() - startTime;
    console.log(`⏱️  Parsing completed in ${duration}ms`);
    
    if (parseResult.success) {
      console.log('✅ CSV parsing succeeded');
      console.log(`📊 Parsed ${parseResult.rowCount} rows`);
      console.log('📋 Headers:', parseResult.headers);
      
      // Check data types - should all be strings now (no dynamicTyping)
      const firstRow = parseResult.data[0];
      console.log('\n🔍 Data type analysis:');
      Object.entries(firstRow).forEach(([key, value]) => {
        console.log(`  ${key}: "${value}" (${typeof value})`);
      });
      
      // Verify all values are strings
      const allStrings = Object.values(firstRow).every(value => typeof value === 'string');
      if (allStrings) {
        console.log('✅ All values are strings (dynamicTyping disabled correctly)');
      } else {
        console.log('❌ Some values are not strings (dynamicTyping may still be active)');
        return false;
      }
      
      // Test validation (this is where the "trim is not a function" error occurred)
      console.log('\n🔍 Testing validation with parsed data...');
      try {
        const validationErrors = await validatePatientData(parseResult.data, mockDoctors);
        console.log(`✅ Validation completed successfully with ${validationErrors.length} errors`);
        
        if (validationErrors.length > 0) {
          console.log('📋 Validation errors (expected for test data):');
          validationErrors.slice(0, 3).forEach(error => {
            console.log(`  - Row ${error.row}: ${error.message}`);
          });
        }
        
        return true;
      } catch (validationError) {
        console.log('❌ Validation failed:', validationError.message);
        if (validationError.message.includes('trim is not a function')) {
          console.log('🐛 CRITICAL: The "trim is not a function" bug still exists!');
        }
        return false;
      }
      
    } else {
      console.log('❌ CSV parsing failed:', parseResult.error.message);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('Stack:', error.stack);
    return false;
  }
}

async function testStringOnlyCSVParsing() {
  console.log('\n📋 Test 2: CSV with string-only data (preservation test)');
  console.log('--------------------------------------------------------');
  
  // Create CSV content with only string values
  const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,twenty-five/M,Dr. Smith,2024-01-15
Jane Smith,thirty/F,Dr. Johnson,2024-01-16`;

  try {
    const parseResult = parseCSVString(csvContent);
    
    if (parseResult.success) {
      console.log('✅ String-only CSV parsing succeeded');
      console.log(`📊 Parsed ${parseResult.rowCount} rows`);
      
      // Verify data integrity
      const firstRow = parseResult.data[0];
      console.log('📋 Sample data:', firstRow);
      
      // All should still be strings
      const allStrings = Object.values(firstRow).every(value => typeof value === 'string');
      console.log(allStrings ? '✅ All values preserved as strings' : '❌ Data type issue');
      
      return allStrings;
    } else {
      console.log('❌ String-only CSV parsing failed:', parseResult.error.message);
      return false;
    }
    
  } catch (error) {
    console.log('❌ String-only test failed:', error.message);
    return false;
  }
}

async function testFileBasedParsing() {
  console.log('\n📋 Test 3: File-based CSV parsing');
  console.log('----------------------------------');
  
  // Create a CSV file with numeric values
  const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
Alice Brown,28/F,Dr. Smith,2024-01-15
Charlie Davis,35/M,Dr. Johnson,2024-01-16`;

  try {
    // Create a File object (simulating file upload)
    const csvFile = new File([csvContent], 'test-patients.csv', { type: 'text/csv' });
    
    console.log('Testing parseCSV with File object...');
    const startTime = Date.now();
    
    // Set a timeout to catch hanging
    const parsePromise = parseCSV(csvFile);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Parsing timeout - hanging detected')), 10000)
    );
    
    const parseResult = await Promise.race([parsePromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    console.log(`⏱️  File parsing completed in ${duration}ms`);
    
    if (parseResult.success) {
      console.log('✅ File-based CSV parsing succeeded');
      console.log(`📊 Parsed ${parseResult.rowCount} rows`);
      
      // Check first row data types
      const firstRow = parseResult.data[0];
      const allStrings = Object.values(firstRow).every(value => typeof value === 'string');
      console.log(allStrings ? '✅ All values are strings' : '❌ Data type issue');
      
      return allStrings;
    } else {
      console.log('❌ File-based parsing failed:', parseResult.error.message);
      return false;
    }
    
  } catch (error) {
    if (error.message.includes('timeout') || error.message.includes('hanging')) {
      console.log('❌ CRITICAL: CSV parsing is still hanging!');
      console.log('🐛 The infinite loading bug has NOT been fixed');
    } else {
      console.log('❌ File-based test failed:', error.message);
    }
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting CSV Parsing Fix Verification\n');
  
  const test1 = await testNumericCSVParsing();
  const test2 = await testStringOnlyCSVParsing();
  const test3 = await testFileBasedParsing();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(50));
  console.log(`Test 1 (Numeric CSV): ${test1 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 2 (String CSV): ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 3 (File-based): ${test3 ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = test1 && test2 && test3;
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ CSV parsing hanging bug has been FIXED');
    console.log('✅ No regressions detected');
    console.log('✅ dynamicTyping has been properly disabled');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('❌ The CSV parsing fix may not be complete');
    console.log('🔧 Please review the implementation');
  }
  console.log('='.repeat(50));
  
  return allPassed;
}

// Run the verification
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Verification script error:', error);
    process.exit(1);
  });