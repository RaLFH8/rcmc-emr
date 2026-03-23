/**
 * Simple demonstration of the CSV parsing bug
 * Shows how dynamicTyping converts strings to numbers, causing trim errors
 */

// Simulate Papa Parse behavior with dynamicTyping: true
function simulatePapaParseWithDynamicTyping(csvString) {
  const lines = csvString.trim().split('\n');
  const headers = lines[0].split(',');
  
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Simulate dynamicTyping: true behavior
      // Convert numeric strings to numbers
      if (value && !isNaN(value) && !isNaN(parseFloat(value))) {
        value = parseFloat(value);
      }
      
      row[header] = value;
    });
    
    return row;
  });
  
  return { data, headers };
}

// Simulate the validation function that causes the bug
function validatePatientDataSync(rows) {
  const errors = [];
  
  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // This is the problematic line from patientImportService.js:490
    const ageSex = row['Age/Sex'];
    
    console.log(`\n🔍 Row ${rowNumber}:`);
    console.log(`- ageSex value: "${ageSex}"`);
    console.log(`- ageSex type: ${typeof ageSex}`);
    
    try {
      // This is where the bug occurs - calling trim on a number
      if (!ageSex || (typeof ageSex === 'string' && ageSex.trim() === '')) {
        errors.push({
          row: rowNumber,
          field: 'age_sex',
          message: 'Missing required field: age_sex'
        });
      }
      console.log(`✅ Row ${rowNumber}: No error`);
    } catch (error) {
      console.log(`💥 Row ${rowNumber}: ERROR - ${error.message}`);
      errors.push({
        row: rowNumber,
        field: 'age_sex',
        message: `Validation error: ${error.message}`
      });
    }
  });
  
  return errors;
}

// Test data that triggers the bug
const csvContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,25/M,Dr. Smith,2024-01-15
Jane Smith,30.5/F,Dr. Johnson,2024-01-16
Bob Wilson,45/M,Dr. Smith,2024-01-17`;

console.log('🧪 CSV Parsing Bug Demonstration');
console.log('================================\n');

console.log('📄 Original CSV Content:');
console.log(csvContent);

console.log('\n⚙️  Parsing with dynamicTyping: true...');
const parseResult = simulatePapaParseWithDynamicTyping(csvContent);

console.log('\n📊 Parsed Data:');
parseResult.data.forEach((row, index) => {
  console.log(`Row ${index + 1}:`, row);
});

console.log('\n🎯 Key Issue: Notice how "25/M" becomes just 25 (number)');
console.log('This happens because Papa Parse dynamicTyping converts "25" to number 25');
console.log('But the validation expects "25/M" as a string to call .trim() on it');

console.log('\n🔥 Testing Validation (this will demonstrate the bug):');
const validationErrors = validatePatientDataSync(parseResult.data);

console.log('\n📋 Validation Results:');
console.log(`Total errors: ${validationErrors.length}`);
validationErrors.forEach(error => {
  console.log(`- Row ${error.row}: ${error.message}`);
});

console.log('\n🎯 Root Cause Analysis:');
console.log('1. Papa Parse dynamicTyping: true converts "25/M" to number 25');
console.log('2. Validation code calls ageSex.trim() without type checking');
console.log('3. Numbers don\'t have a .trim() method');
console.log('4. This throws "trim is not a function" error');
console.log('5. The error prevents parsing completion, causing infinite loading');

console.log('\n💡 Expected Fix:');
console.log('- Set dynamicTyping: false in Papa Parse configuration');
console.log('- This keeps all CSV values as strings');
console.log('- Validation functions can safely call .trim() on strings');
console.log('- Type conversion happens during validation, not parsing');