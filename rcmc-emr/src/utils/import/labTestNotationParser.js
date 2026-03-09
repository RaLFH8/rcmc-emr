/**
 * Lab Test Special Notation Parser
 * 
 * Parses special notations in laboratory test names:
 * - "(each)" for per-item pricing
 * - "/" for alternative test names
 * - Package tests detection
 * - Turnaround time extraction
 * 
 * Requirements: 4.3, 4.4, 4.5
 */

/**
 * Parse special notations in lab test name
 * 
 * @param {string} testName - Test name with potential special notations
 * @returns {Object} Parsed test information
 */
export function parseLabTestNotation(testName) {
  if (!testName || typeof testName !== 'string') {
    return {
      name: '',
      alternative_names: [],
      per_item_pricing: false,
      is_package: false,
      clean_name: ''
    };
  }

  const result = {
    name: testName.trim(),
    alternative_names: [],
    per_item_pricing: false,
    is_package: false,
    clean_name: testName.trim()
  };

  // Handle "(each)" notation for per-item pricing
  if (testName.includes('(each)')) {
    result.per_item_pricing = true;
    result.clean_name = testName.replace(/\(each\)/gi, '').trim();
    result.name = result.clean_name;
  }

  // Handle "/" notation for alternative names
  if (result.clean_name.includes('/')) {
    const parts = result.clean_name.split('/').map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length > 1) {
      result.name = parts[0];
      result.alternative_names = parts.slice(1);
      result.clean_name = parts[0];
    }
  }

  // Detect package tests
  const packageKeywords = ['package', 'panel', 'profile', 'battery', 'bundle', 'set'];
  const lowerName = result.clean_name.toLowerCase();
  result.is_package = packageKeywords.some(keyword => lowerName.includes(keyword));

  return result;
}

/**
 * Extract turnaround time from test description or name
 * 
 * @param {string} text - Test name or description
 * @returns {string|null} Turnaround time or null if not found
 */
export function extractTurnaroundTime(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const lowerText = text.toLowerCase();

  // Pattern 1: "2-4 hours", "1-2 days", "24 hours"
  const timePattern1 = /(\d+(?:-\d+)?)\s*(hour|hours|hr|hrs|day|days|week|weeks|minute|minutes|min|mins)/i;
  const match1 = text.match(timePattern1);
  if (match1) {
    return match1[0].trim();
  }

  // Pattern 2: "within 24 hours", "in 2 days"
  const timePattern2 = /(within|in)\s+(\d+(?:-\d+)?)\s*(hour|hours|hr|hrs|day|days|week|weeks)/i;
  const match2 = text.match(timePattern2);
  if (match2) {
    return match2[0].trim();
  }

  // Pattern 3: Common phrases
  if (lowerText.includes('same day')) return 'Same day';
  if (lowerText.includes('next day')) return 'Next day';
  if (lowerText.includes('immediate')) return 'Immediate';
  if (lowerText.includes('stat')) return 'STAT';
  if (lowerText.includes('rush')) return 'Rush';

  return null;
}

/**
 * Detect if test is a package/panel that includes multiple sub-tests
 * 
 * @param {string} testName - Test name
 * @param {string} description - Test description (optional)
 * @returns {boolean} True if package test
 */
export function isPackageTest(testName, description = '') {
  const packageKeywords = ['package', 'panel', 'profile', 'battery', 'bundle', 'set', 'comprehensive'];
  const combinedText = `${testName} ${description}`.toLowerCase();
  
  return packageKeywords.some(keyword => combinedText.includes(keyword));
}

/**
 * Extract included tests from package description
 * 
 * @param {string} description - Package test description
 * @returns {Array<string>} Array of included test names
 */
export function extractIncludedTests(description) {
  if (!description || typeof description !== 'string') {
    return [];
  }

  const tests = [];

  // Pattern 1: "includes: test1, test2, test3"
  const includesPattern = /includes?:?\s*([^.]+)/i;
  const includesMatch = description.match(includesPattern);
  if (includesMatch) {
    const testList = includesMatch[1].split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0);
    tests.push(...testList);
  }

  // Pattern 2: "with test1, test2, and test3"
  const withPattern = /with\s+([^.]+)/i;
  const withMatch = description.match(withPattern);
  if (withMatch && tests.length === 0) {
    const testList = withMatch[1].split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0);
    tests.push(...testList);
  }

  // Pattern 3: Bullet points or numbered lists
  const bulletPattern = /[•\-*]\s*([^\n•\-*]+)/g;
  let bulletMatch;
  while ((bulletMatch = bulletPattern.exec(description)) !== null) {
    const test = bulletMatch[1].trim();
    if (test.length > 0 && !tests.includes(test)) {
      tests.push(test);
    }
  }

  return tests;
}

/**
 * Parse complete lab test with all special notations
 * 
 * @param {Object} test - Test object from CSV
 * @returns {Object} Fully parsed test information
 */
export function parseCompleteLabTest(test) {
  const testName = test.name || test.test_name || test['Test Name'] || '';
  const description = test.description || test['Description'] || '';
  const turnaroundTime = test.turnaround_time || test['Turnaround Time'] || '';

  // Parse notation
  const notation = parseLabTestNotation(testName);

  // Extract turnaround time
  let extractedTurnaroundTime = extractTurnaroundTime(turnaroundTime);
  if (!extractedTurnaroundTime) {
    extractedTurnaroundTime = extractTurnaroundTime(description);
  }
  if (!extractedTurnaroundTime) {
    extractedTurnaroundTime = extractTurnaroundTime(testName);
  }

  // Check if package test
  const isPackage = notation.is_package || isPackageTest(testName, description);

  // Extract included tests if package
  const includedTests = isPackage ? extractIncludedTests(description) : [];

  return {
    original_name: testName,
    name: notation.name,
    clean_name: notation.clean_name,
    alternative_names: notation.alternative_names,
    per_item_pricing: notation.per_item_pricing,
    is_package: isPackage,
    included_tests: includedTests,
    turnaround_time: extractedTurnaroundTime,
    description: description
  };
}

/**
 * Batch parse multiple lab tests
 * 
 * @param {Array<Object>} tests - Array of test objects
 * @returns {Array<Object>} Array of parsed test objects
 */
export function batchParseLabTests(tests) {
  return tests.map((test, index) => ({
    row: index + 1,
    ...parseCompleteLabTest(test)
  }));
}

export default {
  parseLabTestNotation,
  extractTurnaroundTime,
  isPackageTest,
  extractIncludedTests,
  parseCompleteLabTest,
  batchParseLabTests
};
