/**
 * Patient Field Parser
 * 
 * Parses complex patient data fields including Age/Sex, doctor names, discounts, and payments.
 * Provides intelligent field extraction and matching for patient import.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { supabase } from '../../lib/supabase.js';

/**
 * Parse Age/Sex field (format: "25/M", "30/F", "45 / M")
 * 
 * @param {string} value - Age/Sex value to parse
 * @returns {Object|null} Parsed age and sex, or null if invalid
 */
export function parseAgeSex(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  // Pattern: number / M or F (with optional whitespace)
  const pattern = /^(\d+)\s*\/\s*([MF])$/i;
  const match = value.trim().match(pattern);

  if (!match) {
    return null;
  }

  const age = parseInt(match[1], 10);
  const sex = match[2].toUpperCase();

  // Validate age range
  if (age < 0 || age > 150) {
    return null;
  }

  return {
    age,
    sex
  };
}

/**
 * Calculate date of birth from age
 * 
 * @param {number} age - Age in years
 * @returns {string} Date of birth in YYYY-MM-DD format
 */
export function calculateDateOfBirth(age) {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  
  // Use January 1st as default birth date
  return `${birthYear}-01-01`;
}

/**
 * Parse patient name into components
 * 
 * @param {string} fullName - Full name string
 * @returns {Object} Name components
 */
export function parsePatientName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return {
      first_name: '',
      middle_name: '',
      last_name: ''
    };
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return {
      first_name: parts[0],
      middle_name: '',
      last_name: parts[0]
    };
  } else if (parts.length === 2) {
    return {
      first_name: parts[0],
      middle_name: '',
      last_name: parts[1]
    };
  } else {
    // 3 or more parts: first, middle(s), last
    return {
      first_name: parts[0],
      middle_name: parts.slice(1, -1).join(' '),
      last_name: parts[parts.length - 1]
    };
  }
}

/**
 * Normalize string for comparison
 * 
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeString(str) {
  if (!str) return '';
  return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  if (normalized1 === normalized2) return 1.0;
  if (!normalized1 || !normalized2) return 0.0;

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  return 1 - (distance / maxLength);
}

/**
 * Parse doctor name and match to existing doctor records
 * 
 * @param {string} name - Doctor name from CSV
 * @param {Array} doctors - Array of doctor records from database
 * @param {number} fuzzyThreshold - Similarity threshold for fuzzy matching (default: 0.8)
 * @returns {Object|null} Matched doctor record or null
 */
export function parseDoctorName(name, doctors, fuzzyThreshold = 0.8) {
  if (!name || !doctors || doctors.length === 0) {
    return null;
  }

  const normalized = normalizeString(name);

  // Try exact match on full name
  let match = doctors.find(d => {
    const fullName = `${d.first_name} ${d.last_name}`;
    return normalizeString(fullName) === normalized;
  });

  if (match) return match;

  // Try exact match on last name only
  match = doctors.find(d => 
    normalizeString(d.last_name) === normalized
  );

  if (match) return match;

  // Try fuzzy match on full name
  let bestMatch = null;
  let bestScore = 0;

  for (const doctor of doctors) {
    const fullName = `${doctor.first_name} ${doctor.last_name}`;
    const similarity = calculateSimilarity(name, fullName);

    if (similarity >= fuzzyThreshold && similarity > bestScore) {
      bestMatch = doctor;
      bestScore = similarity;
    }
  }

  return bestMatch;
}

/**
 * Fetch all active doctors from database
 * 
 * @returns {Promise<Array>} Array of doctor records
 */
export async function fetchDoctors() {
  const { data, error } = await supabase
    .from('doctors')
    .select('*')
    .eq('status', 'Active');

  if (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }

  return data || [];
}

/**
 * Parse discount value (percentage or fixed amount)
 * 
 * @param {string|number} value - Discount value
 * @returns {Object} Parsed discount
 */
export function parseDiscount(value) {
  if (value === null || value === undefined || value === '') {
    return {
      amount: 0,
      percentage: 0,
      type: 'none'
    };
  }

  // If already a number, treat as fixed amount
  if (typeof value === 'number') {
    return {
      amount: value,
      percentage: 0,
      type: 'fixed'
    };
  }

  const str = value.toString().trim();

  // Handle percentage: "20%", "10 %"
  if (str.includes('%')) {
    const percentValue = parseFloat(str.replace('%', '').trim());
    if (!isNaN(percentValue)) {
      return {
        amount: 0,
        percentage: percentValue,
        type: 'percentage'
      };
    }
  }

  // Handle fixed amount: "100", "₱100", "PHP 100"
  const cleanedStr = str.replace(/[₱,PHP\s]/gi, '').trim();
  const numValue = parseFloat(cleanedStr);

  if (!isNaN(numValue)) {
    return {
      amount: numValue,
      percentage: 0,
      type: 'fixed'
    };
  }

  // Invalid format
  return {
    amount: 0,
    percentage: 0,
    type: 'invalid'
  };
}

/**
 * Parse payment amount
 * 
 * @param {string|number} value - Payment value
 * @returns {number} Parsed payment amount
 */
export function parsePayment(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  // If already a number, return it
  if (typeof value === 'number') {
    return value;
  }

  // Handle string with currency symbols and commas
  const str = value.toString().trim();
  const cleanedStr = str.replace(/[₱,PHP\s]/gi, '').trim();
  const numValue = parseFloat(cleanedStr);

  return isNaN(numValue) ? 0 : numValue;
}

/**
 * Parse consultation date
 * 
 * @param {string} value - Date value
 * @returns {string|null} Parsed date in YYYY-MM-DD format or null
 */
export function parseConsultationDate(value) {
  if (!value) return null;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    return null;
  }
}

/**
 * Parse complete patient import row
 * 
 * @param {Object} row - CSV row data
 * @param {Array} doctors - Array of doctor records
 * @returns {Object} Parsed patient data
 */
export async function parsePatientImportRow(row, doctors = null) {
  // Fetch doctors if not provided
  if (!doctors) {
    doctors = await fetchDoctors();
  }

  // Parse Age/Sex
  const ageSex = parseAgeSex(row.age_sex || row['Age/Sex'] || '');
  
  // Parse patient name
  const nameComponents = parsePatientName(row.patient_name || row['Patient Name'] || '');

  // Parse doctor
  const doctor = parseDoctorName(row.doctor_name || row.doctor || row.Doctor || '', doctors);

  // Parse discount
  const discount = parseDiscount(row.discount || row.Discount || '');

  // Parse payment
  const payment = parsePayment(row.payment || row.Payment || '');

  // Parse consultation date
  const consultationDate = parseConsultationDate(row.consultation_date || row['Consultation Date'] || '');

  return {
    // Patient fields
    first_name: nameComponents.first_name,
    middle_name: nameComponents.middle_name,
    last_name: nameComponents.last_name,
    age: ageSex ? ageSex.age : null,
    sex: ageSex ? ageSex.sex : null,
    date_of_birth: ageSex ? calculateDateOfBirth(ageSex.age) : null,
    
    // Doctor reference
    doctor_id: doctor ? doctor.id : null,
    doctor_name: row.doctor_name || row.doctor || row.Doctor || '',
    doctor_match: doctor,
    
    // Consultation fields
    consultation_date: consultationDate,
    
    // Billing fields
    discount_amount: discount.amount,
    discount_percentage: discount.percentage,
    discount_type: discount.type,
    payment_amount: payment,
    
    // Original row for reference
    _originalRow: row,
    
    // Validation flags
    _hasValidAgeSex: ageSex !== null,
    _hasDoctorMatch: doctor !== null,
    _hasValidDate: consultationDate !== null
  };
}

/**
 * Validate parsed patient data
 * 
 * @param {Object} parsedData - Parsed patient data
 * @returns {Object} Validation result
 */
export function validateParsedPatientData(parsedData) {
  const errors = [];

  if (!parsedData.first_name || !parsedData.last_name) {
    errors.push('Patient name is required');
  }

  if (!parsedData._hasValidAgeSex) {
    errors.push('Invalid Age/Sex format (expected: "25/M" or "30/F")');
  }

  if (!parsedData._hasDoctorMatch) {
    errors.push(`Doctor not found: ${parsedData.doctor_name}`);
  }

  if (!parsedData._hasValidDate) {
    errors.push('Invalid consultation date');
  }

  if (parsedData.discount_type === 'invalid') {
    errors.push('Invalid discount format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Batch parse patient import rows
 * 
 * @param {Array} rows - Array of CSV rows
 * @returns {Promise<Array>} Array of parsed patient data
 */
export async function batchParsePatientRows(rows) {
  // Fetch doctors once for all rows
  const doctors = await fetchDoctors();

  const parsedRows = [];

  for (const row of rows) {
    const parsed = await parsePatientImportRow(row, doctors);
    const validation = validateParsedPatientData(parsed);
    
    parsedRows.push({
      ...parsed,
      _validation: validation
    });
  }

  return parsedRows;
}

/**
 * Get doctor match confidence score
 * 
 * @param {string} inputName - Input doctor name
 * @param {Object} matchedDoctor - Matched doctor record
 * @returns {number} Confidence score (0-1)
 */
export function getDoctorMatchConfidence(inputName, matchedDoctor) {
  if (!matchedDoctor) return 0;

  const fullName = `${matchedDoctor.first_name} ${matchedDoctor.last_name}`;
  return calculateSimilarity(inputName, fullName);
}

/**
 * Format parsed patient data for display
 * 
 * @param {Object} parsedData - Parsed patient data
 * @returns {string} Formatted display string
 */
export function formatParsedPatientData(parsedData) {
  const lines = [
    `Patient: ${parsedData.first_name} ${parsedData.last_name}`,
    `Age/Sex: ${parsedData.age}/${parsedData.sex}`,
    `Doctor: ${parsedData.doctor_match ? parsedData.doctor_match.first_name + ' ' + parsedData.doctor_match.last_name : 'Not found'}`,
    `Date: ${parsedData.consultation_date}`,
    `Discount: ${parsedData.discount_type === 'percentage' ? parsedData.discount_percentage + '%' : '₱' + parsedData.discount_amount}`,
    `Payment: ₱${parsedData.payment_amount}`
  ];

  return lines.join('\n');
}
