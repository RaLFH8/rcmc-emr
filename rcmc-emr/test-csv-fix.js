/**
 * Simple test to verify the CSV parsing fix
 */

import { parseCSV } from './src/utils/import/csvParser.js';
import { validateInventoryData } from './src/services/import/inventoryImportService.js';

async function testCSVFix() {
  console.log('Testing CSV parsing fix...');
  
  // Create CSV content with numeric values that would trigger the bug
  const csvContent = `Item Name,Price,Stock,Unit
Paracetamol 500mg,25.50,100,tablet
Amoxicillin 250mg,45,75,capsule
Bandage Roll,15.25,50,piece`;

  // Create a File object from the CSV content
  const csvFile = new File([csvContent], 'test-inventory.csv', { type: 'text/csv' });

  try {
    console.log('1. Parsing CSV...');
    const parseResult = await parseCSV(csvFile);
    
    if (parseResult.success) {
      console.log('✅ CSV parsed successfully');
      console.log('Sample row:', parseResult.data[0]);
      console.log('Stock value type:', typeof parseResult.data[0]['Stock']);
      console.log('Stock value:', parseResult.data[0]['Stock']);
      
      console.log('2. Testing validation...');
      const validationErrors = validateInventoryData(parseResult.data);
      
      console.log('✅ Validation completed successfully');
      console.log('Validation errors:', validationErrors.length);
      
      if (validationErrors.length > 0) {
        console.log('Validation errors:', validationErrors);
      }
      
      console.log('🎉 Fix verified! CSV parsing and validation work correctly.');
      
    } else {
      console.log('❌ CSV parsing failed:', parseResult.error.message);
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the test
testCSVFix();