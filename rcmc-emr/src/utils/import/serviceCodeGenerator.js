/**
 * Service Code Generator for Laboratory Tests
 * 
 * Generates unique service codes in the format: LAB-[PREFIX]-[NUMBER]
 * Examples: LAB-HEMA-001, LAB-CHEM-015, LAB-SPEC-003
 * 
 * Requirements: 4.6, 4.7
 */

import { db } from '../../lib/supabase';
import { getCategoryPrefix } from './labTestCategorizer';

/**
 * Generate a unique service code for a laboratory test
 * 
 * @param {string} testName - Test name
 * @param {string} category - Lab test category
 * @returns {Promise<string>} Unique service code
 */
export async function generateServiceCode(testName, category) {
  try {
    // Get category prefix
    const categoryPrefix = getCategoryPrefix(category);
    
    // Query existing codes for this category
    const existingCodes = await db.getServicesByCodePrefix(`LAB-${categoryPrefix}-`);
    
    // Find the highest number used
    let maxNumber = 0;
    if (existingCodes && existingCodes.length > 0) {
      existingCodes.forEach(service => {
        const code = service.service_code || '';
        const match = code.match(/LAB-\w+-(\d+)$/);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      });
    }
    
    // Generate next number
    const nextNumber = maxNumber + 1;
    const paddedNumber = String(nextNumber).padStart(3, '0');
    
    return `LAB-${categoryPrefix}-${paddedNumber}`;
  } catch (error) {
    console.error('Error generating service code:', error);
    // Fallback: generate random code
    const categoryPrefix = getCategoryPrefix(category);
    const randomNumber = Math.floor(Math.random() * 1000);
    const paddedNumber = String(randomNumber).padStart(3, '0');
    return `LAB-${categoryPrefix}-${paddedNumber}`;
  }
}

/**
 * Check if a service code is unique
 * 
 * @param {string} code - Service code to check
 * @returns {Promise<boolean>} True if unique, false if already exists
 */
export async function isServiceCodeUnique(code) {
  try {
    const existing = await db.getServiceByCode(code);
    return !existing;
  } catch (error) {
    console.error('Error checking service code uniqueness:', error);
    return false;
  }
}

/**
 * Generate unique service codes for multiple tests
 * Ensures all codes are unique within the batch
 * 
 * @param {Array<Object>} tests - Array of test objects with name and category
 * @returns {Promise<Array<Object>>} Array of tests with generated service codes
 */
export async function batchGenerateServiceCodes(tests) {
  const results = [];
  const usedCodes = new Set();
  
  for (const test of tests) {
    let code = await generateServiceCode(test.name, test.category);
    
    // Ensure uniqueness within batch
    let attempts = 0;
    while (usedCodes.has(code) && attempts < 10) {
      // Regenerate with incremented number
      const match = code.match(/LAB-(\w+)-(\d+)$/);
      if (match) {
        const prefix = match[1];
        const number = parseInt(match[2], 10) + 1;
        const paddedNumber = String(number).padStart(3, '0');
        code = `LAB-${prefix}-${paddedNumber}`;
      }
      attempts++;
    }
    
    usedCodes.add(code);
    
    results.push({
      ...test,
      service_code: code
    });
  }
  
  return results;
}

/**
 * Validate service code format
 * 
 * @param {string} code - Service code to validate
 * @returns {boolean} True if valid format
 */
export function isValidServiceCodeFormat(code) {
  // Format: LAB-[PREFIX]-[NUMBER]
  // PREFIX: 3-6 uppercase letters
  // NUMBER: 3 digits
  const pattern = /^LAB-[A-Z]{3,6}-\d{3}$/;
  return pattern.test(code);
}

/**
 * Parse service code into components
 * 
 * @param {string} code - Service code
 * @returns {Object|null} Parsed components or null if invalid
 */
export function parseServiceCode(code) {
  const pattern = /^LAB-([A-Z]{3,6})-(\d{3})$/;
  const match = code.match(pattern);
  
  if (!match) {
    return null;
  }
  
  return {
    prefix: match[1],
    number: parseInt(match[2], 10),
    full_code: code
  };
}

export default {
  generateServiceCode,
  isServiceCodeUnique,
  batchGenerateServiceCodes,
  isValidServiceCodeFormat,
  parseServiceCode
};
