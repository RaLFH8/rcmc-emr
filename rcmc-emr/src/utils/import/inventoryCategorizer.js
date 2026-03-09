/**
 * Inventory Categorizer Engine
 * 
 * Automatically classifies inventory items into three categories:
 * - Services: Medical services, consultations, procedures
 * - Medicines: Pharmaceutical products with dosages
 * - Medical_Supplies: Medical equipment and supplies
 * 
 * Uses keyword matching, price heuristics, and unit analysis.
 * Target accuracy: ≥95% on provided dataset
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.10
 */

/**
 * Service keywords for classification
 */
const SERVICE_KEYWORDS = [
  'consultation',
  'procedure',
  'examination',
  'test',
  'screening',
  'therapy',
  'checkup',
  'assessment',
  'evaluation',
  'diagnosis',
  'treatment',
  'session',
  'visit',
  'follow-up',
  'monitoring'
];

/**
 * Medicine keywords for classification
 */
const MEDICINE_KEYWORDS = [
  'tablet',
  'capsule',
  'syrup',
  'injection',
  'mg',
  'ml',
  'suspension',
  'ointment',
  'cream',
  'drops',
  'inhaler',
  'patch',
  'suppository',
  'solution',
  'powder',
  'lotion',
  'gel',
  'spray'
];

/**
 * Categorize an inventory item into Services, Medicines, or Medical_Supplies
 * 
 * @param {Object} item - Inventory item
 * @param {string} item.name - Item name
 * @param {number} item.price - Item price
 * @param {string} item.unit - Item unit (optional)
 * @returns {string} Category: 'Services', 'Medicines', or 'Medical_Supplies'
 */
export function categorizeInventoryItem(item) {
  const name = (item.name || '').toLowerCase();
  const price = parseFloat(item.price) || 0;
  const unit = (item.unit || '').toLowerCase();

  // Step 1: Keyword-based classification
  
  // Check for service keywords
  if (SERVICE_KEYWORDS.some(keyword => name.includes(keyword))) {
    return 'Services';
  }

  // Check for medicine keywords
  if (MEDICINE_KEYWORDS.some(keyword => name.includes(keyword))) {
    return 'Medicines';
  }

  // Step 2: Price-based heuristics
  // High-priced items without packaging indicators are likely services
  if (price > 500 && !unit.includes('box') && !unit.includes('pack') && !unit.includes('bottle')) {
    return 'Services';
  }

  // Step 3: Unit-based heuristics
  // Items with medical dosage units are medicines
  if (unit.includes('mg') || unit.includes('ml') || unit.includes('tablet') || 
      unit.includes('capsule') || unit.includes('dose')) {
    return 'Medicines';
  }

  // Step 4: Dosage extraction
  // If we can extract dosage information, it's likely a medicine
  const dosage = extractDosage(name);
  if (dosage) {
    return 'Medicines';
  }

  // Default: Medical Supplies
  return 'Medical_Supplies';
}

/**
 * Extract dosage information from item name
 * 
 * @param {string} itemName - Item name
 * @returns {Object|null} Dosage info or null
 */
export function extractDosage(itemName) {
  const patterns = [
    // "Amoxicillin 500mg Capsule"
    /(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu|units?)\s*(\w+)?/i,
    
    // "Paracetamol 500 mg"
    /(\d+(?:\.\d+)?)\s+(mg|ml|g|mcg|iu|units?)/i,
    
    // "Vitamin C 1000mg"
    /(\d+(?:\.\d+)?)(mg|ml|g|mcg|iu|units?)/i
  ];

  for (const pattern of patterns) {
    const match = itemName.match(pattern);
    if (match) {
      return {
        amount: parseFloat(match[1]),
        unit: match[2].toLowerCase(),
        form: match[3] || detectForm(itemName),
        originalName: itemName,
        cleanName: itemName.replace(match[0], '').trim()
      };
    }
  }

  return null;
}

/**
 * Detect medication form from item name
 * 
 * @param {string} itemName - Item name
 * @returns {string} Medication form
 */
function detectForm(itemName) {
  const forms = [
    'tablet',
    'capsule',
    'syrup',
    'injection',
    'ointment',
    'cream',
    'drops',
    'inhaler',
    'patch',
    'suppository',
    'solution',
    'powder',
    'lotion',
    'gel',
    'spray'
  ];

  const lower = itemName.toLowerCase();

  for (const form of forms) {
    if (lower.includes(form)) {
      return form;
    }
  }

  return 'unknown';
}

/**
 * Standardize measurement units to canonical forms
 * 
 * @param {string} unit - Unit string
 * @returns {string} Standardized unit
 */
export function standardizeUnit(unit) {
  if (!unit) return '';

  const standardUnits = {
    // Weight
    'milligram': 'mg',
    'milligrams': 'mg',
    'gram': 'g',
    'grams': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'microgram': 'mcg',
    'micrograms': 'mcg',
    
    // Volume
    'milliliter': 'ml',
    'milliliters': 'ml',
    'liter': 'l',
    'liters': 'l',
    
    // Count
    'tablet': 'tablets',
    'tablets': 'tablets',
    'capsule': 'capsules',
    'capsules': 'capsules',
    'piece': 'pieces',
    'pieces': 'pieces',
    'box': 'boxes',
    'boxes': 'boxes',
    'bottle': 'bottles',
    'bottles': 'bottles',
    'vial': 'vials',
    'vials': 'vials',
    'ampule': 'ampules',
    'ampules': 'ampules',
    'pack': 'packs',
    'packs': 'packs',
    
    // International Units
    'iu': 'IU',
    'unit': 'units',
    'units': 'units'
  };

  const normalized = unit.toLowerCase().trim();
  return standardUnits[normalized] || unit;
}

/**
 * Batch categorize multiple inventory items
 * 
 * @param {Array} items - Array of inventory items
 * @returns {Object} Categorization results with breakdown
 */
export function batchCategorizeInventory(items) {
  const results = {
    items: [],
    breakdown: {
      Services: 0,
      Medicines: 0,
      Medical_Supplies: 0
    }
  };

  items.forEach(item => {
    const category = categorizeInventoryItem(item);
    const dosage = extractDosage(item.name);
    const standardizedUnit = standardizeUnit(item.unit);

    results.items.push({
      ...item,
      category,
      dosage,
      standardized_unit: standardizedUnit
    });

    results.breakdown[category]++;
  });

  return results;
}

/**
 * Calculate categorization confidence score
 * 
 * @param {Object} item - Inventory item
 * @param {string} category - Assigned category
 * @returns {number} Confidence score (0-1)
 */
export function calculateConfidence(item, category) {
  const name = (item.name || '').toLowerCase();
  const price = parseFloat(item.price) || 0;
  const unit = (item.unit || '').toLowerCase();

  let confidence = 0.5; // Base confidence

  // Keyword match increases confidence
  if (category === 'Services') {
    const matchCount = SERVICE_KEYWORDS.filter(kw => name.includes(kw)).length;
    confidence += matchCount * 0.15;
  } else if (category === 'Medicines') {
    const matchCount = MEDICINE_KEYWORDS.filter(kw => name.includes(kw)).length;
    confidence += matchCount * 0.15;
  }

  // Dosage extraction increases confidence for medicines
  if (category === 'Medicines' && extractDosage(name)) {
    confidence += 0.2;
  }

  // Price heuristics
  if (category === 'Services' && price > 500) {
    confidence += 0.1;
  }

  // Unit heuristics
  if (category === 'Medicines' && (unit.includes('mg') || unit.includes('ml') || unit.includes('tablet'))) {
    confidence += 0.15;
  }

  return Math.min(1.0, confidence);
}

/**
 * Validate categorization accuracy against known dataset
 * 
 * @param {Array} items - Items with expected categories
 * @returns {Object} Accuracy metrics
 */
export function validateCategorization(items) {
  let correct = 0;
  let total = items.length;
  const errors = [];

  items.forEach((item, index) => {
    const predicted = categorizeInventoryItem(item);
    const expected = item.expected_category;

    if (predicted === expected) {
      correct++;
    } else {
      errors.push({
        row: index + 1,
        name: item.name,
        expected,
        predicted,
        confidence: calculateConfidence(item, predicted)
      });
    }
  });

  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  return {
    accuracy: accuracy.toFixed(2),
    correct,
    total,
    errors
  };
}

/**
 * Get category statistics for a set of items
 * 
 * @param {Array} items - Categorized items
 * @returns {Object} Category statistics
 */
export function getCategoryStatistics(items) {
  const stats = {
    Services: { count: 0, totalValue: 0, avgPrice: 0 },
    Medicines: { count: 0, totalValue: 0, avgPrice: 0 },
    Medical_Supplies: { count: 0, totalValue: 0, avgPrice: 0 }
  };

  items.forEach(item => {
    const category = item.category || categorizeInventoryItem(item);
    const price = parseFloat(item.price) || 0;

    if (stats[category]) {
      stats[category].count++;
      stats[category].totalValue += price;
    }
  });

  // Calculate averages
  Object.keys(stats).forEach(category => {
    if (stats[category].count > 0) {
      stats[category].avgPrice = stats[category].totalValue / stats[category].count;
    }
  });

  return stats;
}

export default {
  categorizeInventoryItem,
  extractDosage,
  standardizeUnit,
  batchCategorizeInventory,
  calculateConfidence,
  validateCategorization,
  getCategoryStatistics
};
