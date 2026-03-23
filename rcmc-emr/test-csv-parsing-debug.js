// Debug CSV parsing issue
import { parseCSV } from './src/utils/import/csvParser.js';

// Create a test CSV file-like object
const testCSVContent = `Patient Name,Age/Sex,Doctor,Consultation Date
John Doe,30/M,Dr. Smith,2024-01-15
Jane Smith,25/F,Dr. Johnson,2024-01-16
Bob Wilson,45/M,Dr. Smith,2024-01-17`;

// Create a mock file object
const mockFile = new File([testCSVContent], 'test.csv', { type: 'text/csv' });

console.log('Testing CSV parsing...');
console.log('File created:', mockFile.name, mockFile.size, 'bytes');

// Test the parsing
parseCSV(mockFile)
  .then(result => {
    console.log('✅ CSV parsing successful!');
    console.log('Result:', result);
    console.log('Headers:', result.headers);
    console.log('Row count:', result.rowCount);
    console.log('First row:', result.data[0]);
  })
  .catch(error => {
    console.error('❌ CSV parsing failed:', error);
  });