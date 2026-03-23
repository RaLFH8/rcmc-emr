/**
 * CSV Parser Utility
 * Handles parsing revenue data to CSV format with proper special character escaping
 * Supports round-trip parsing for testing integrity
 */

/**
 * Parse revenue data into CSV format
 * @param {Array<RevenueDataPoint>} data - Revenue data points
 * @param {number} totalRevenue - Total revenue amount
 * @returns {string} CSV formatted string
 */
export function parseToCSV(data, totalRevenue) {
  const headers = ['Name', 'Amount', 'Percentage'];
  
  const rows = data.map(item => [
    escapeCSVField(item.name || item.category),
    (item.value || item.amount).toFixed(2),
    item.percentage ? `${item.percentage.toFixed(2)}%` : 'N/A'
  ]);
  
  // Add total row
  rows.push(['Total', totalRevenue.toFixed(2), '100.00%']);
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}

/**
 * Escape special characters in CSV fields
 * Handles commas, quotes, and newlines by wrapping in quotes and escaping internal quotes
 * @param {string} field - Field value
 * @returns {string} Escaped field
 */
export function escapeCSVField(field) {
  if (typeof field !== 'string') {
    return field;
  }
  
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  return field;
}

/**
 * Parse CSV string back to data structure (for round-trip testing)
 * @param {string} csv - CSV string
 * @returns {Array<Object>} Parsed data
 */
export function parseFromCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1, -1).map(line => {
    const values = parseCSVLine(line);
    return {
      name: values[0],
      amount: parseFloat(values[1]),
      percentage: parseFloat(values[2].replace('%', ''))
    };
  });
}

/**
 * Parse a single CSV line handling quoted fields
 * Properly handles escaped quotes within quoted fields
 * @param {string} line - CSV line
 * @returns {Array<string>} Parsed values
 */
export function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote - add single quote to current value
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      values.push(current);
      current = '';
    } else {
      // Regular character
      current += char;
    }
  }
  
  // Push the last value
  values.push(current);
  return values;
}
