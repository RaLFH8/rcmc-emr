// Simple test to check the fix
const testData = [
  { 'Item Name': 'Paracetamol', 'Price': 25.50, 'Stock': 100 },
  { 'Item Name': 'Amoxicillin', 'Price': 45, 'Stock': 75 }
];

console.log('Testing validation with numeric values...');

// Simulate the validation logic
testData.forEach((row, index) => {
  const rowNumber = index + 1;
  console.log(`Row ${rowNumber}:`);
  
  // Check required fields
  const itemName = row['Item Name'];
  console.log(`  Item Name: "${itemName}" (type: ${typeof itemName})`);
  
  // This is the line that was causing the error
  try {
    if (!itemName || (typeof itemName === 'string' && itemName.trim() === '') || (typeof itemName !== 'string' && String(itemName).trim() === '')) {
      console.log('  ❌ Item name validation failed');
    } else {
      console.log('  ✅ Item name validation passed');
    }
  } catch (error) {
    console.log(`  ❌ Error during validation: ${error.message}`);
  }
});

console.log('Test completed!');