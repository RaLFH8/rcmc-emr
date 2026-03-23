// Simple test to verify CSV parsing works
console.log('Testing CSV parsing...');

// Test the parseCSVLine function
function parseCSVLine(line) {
  if (!line || typeof line !== 'string') {
    return [];
  }
  
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.filter(cell => cell !== undefined);
}

// Test parsing a simple CSV line
const testLine = 'John Doe,30/M,Dr. Smith,2024-01-15';
const parsed = parseCSVLine(testLine);
console.log('Parsed line:', parsed);

// Test with quotes
const testLineWithQuotes = '"John, Jr.",30/M,"Dr. Smith, MD",2024-01-15';
const parsedWithQuotes = parseCSVLine(testLineWithQuotes);
console.log('Parsed line with quotes:', parsedWithQuotes);

console.log('✅ CSV line parsing test completed');