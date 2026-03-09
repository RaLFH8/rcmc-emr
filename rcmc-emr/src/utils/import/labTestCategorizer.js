/**
 * Lab Test Categorizer
 * 
 * Automatically categorizes laboratory tests into 15 medical categories
 * based on keyword matching and test name patterns.
 * 
 * Requirements: 4.1, 4.2, 4.10
 */

/**
 * Lab Test Categories with Keywords and Prefixes
 */
export const LAB_CATEGORIES = {
  'Hematology': {
    keywords: ['cbc', 'hemoglobin', 'hematocrit', 'platelet', 'wbc', 'rbc', 'blood count', 'esr', 'complete blood', 'differential count', 'reticulocyte'],
    prefix: 'HEMA'
  },
  'Clinical_Chemistry': {
    keywords: ['glucose', 'cholesterol', 'triglyceride', 'creatinine', 'uric acid', 'bun', 'sgpt', 'sgot', 'lipid', 'fbs', 'rbs', 'alt', 'ast', 'alkaline phosphatase', 'bilirubin', 'albumin', 'protein', 'electrolyte', 'sodium', 'potassium', 'chloride', 'calcium', 'phosphorus', 'magnesium', 'ldl', 'hdl', 'vldl'],
    prefix: 'CHEM'
  },
  'Serology': {
    keywords: ['hbsag', 'vdrl', 'hiv', 'dengue', 'typhoid', 'antibody', 'antigen', 'tpha', 'hepatitis', 'anti-hbs', 'anti-hcv', 'rapid test', 'elisa', 'widal', 'ns1'],
    prefix: 'SERO'
  },
  'Microbiology': {
    keywords: ['culture', 'sensitivity', 'gram stain', 'afb', 'koh', 'bacterial', 'fungal', 'antibiotic', 'susceptibility', 'blood culture', 'urine culture', 'sputum culture', 'wound culture'],
    prefix: 'MICRO'
  },
  'Urinalysis': {
    keywords: ['urinalysis', 'urine', 'microscopy', 'urine test', 'routine urinalysis', 'urine exam', 'urine analysis'],
    prefix: 'URINE'
  },
  'Fecalysis': {
    keywords: ['fecalysis', 'stool', 'fecal', 'occult blood', 'ova', 'parasite', 'stool exam', 'fecal analysis', 'routine fecalysis'],
    prefix: 'FECAL'
  },
  'Immunology': {
    keywords: ['immunoglobulin', 'complement', 'autoantibody', 'rheumatoid', 'ana', 'ige', 'igg', 'igm', 'iga', 'c3', 'c4', 'rf', 'aso', 'crp', 'c-reactive protein'],
    prefix: 'IMMUNO'
  },
  'Toxicology': {
    keywords: ['drug test', 'toxicology', 'alcohol', 'substance', 'screening', 'drug screen', 'urine drug', 'methamphetamine', 'marijuana', 'cocaine', 'opiates'],
    prefix: 'TOX'
  },
  'Molecular_Diagnostics': {
    keywords: ['pcr', 'dna', 'rna', 'molecular', 'genetic', 'covid', 'rt-pcr', 'real-time pcr', 'nucleic acid', 'gene', 'sars-cov-2', 'covid-19'],
    prefix: 'MOLEC'
  },
  'Histopathology': {
    keywords: ['biopsy', 'histopath', 'tissue', 'frozen section', 'pathology', 'histologic', 'surgical pathology', 'tissue exam'],
    prefix: 'HISTO'
  },
  'Cytology': {
    keywords: ['pap smear', 'cytology', 'fnab', 'fine needle', 'cervical', 'cytologic', 'pap test', 'cervical smear', 'aspiration cytology'],
    prefix: 'CYTO'
  },
  'Blood_Banking': {
    keywords: ['blood typing', 'crossmatch', 'blood group', 'rh factor', 'blood type', 'abo typing', 'rh typing', 'compatibility test', 'blood grouping'],
    prefix: 'BLOOD'
  },
  'Coagulation_Studies': {
    keywords: ['pt', 'ptt', 'inr', 'coagulation', 'bleeding time', 'clotting', 'aptt', 'prothrombin', 'partial thromboplastin', 'clotting time', 'fibrinogen', 'd-dimer'],
    prefix: 'COAG'
  },
  'Endocrinology': {
    keywords: ['thyroid', 'tsh', 't3', 't4', 'hormone', 'cortisol', 'testosterone', 'fsh', 'lh', 'prolactin', 'estrogen', 'progesterone', 'growth hormone', 'acth', 'free t3', 'free t4', 'thyroid function'],
    prefix: 'ENDO'
  },
  'Special_Tests': {
    keywords: [],  // Default category for unmatched tests
    prefix: 'SPEC'
  }
};

/**
 * Categorize a laboratory test based on its name
 * 
 * @param {Object} test - Test object with name property
 * @param {string} test.name - Test name
 * @returns {string} Category name (one of 15 categories)
 */
export function categorizeLabTest(test) {
  const testName = (test.name || test.test_name || test['Test Name'] || '').toLowerCase().trim();
  
  if (!testName) {
    return 'Special_Tests';
  }

  // Try to match against each category's keywords
  for (const [category, config] of Object.entries(LAB_CATEGORIES)) {
    // Skip Special_Tests as it's the default
    if (category === 'Special_Tests') continue;
    
    // Check if any keyword matches the test name
    const hasMatch = config.keywords.some(keyword => {
      return testName.includes(keyword.toLowerCase());
    });
    
    if (hasMatch) {
      return category;
    }
  }
  
  // Default to Special_Tests if no match found
  return 'Special_Tests';
}

/**
 * Get category prefix for service code generation
 * 
 * @param {string} category - Category name
 * @returns {string} Category prefix (e.g., 'HEMA', 'CHEM')
 */
export function getCategoryPrefix(category) {
  const config = LAB_CATEGORIES[category];
  return config ? config.prefix : 'SPEC';
}

/**
 * Get all available lab test categories
 * 
 * @returns {Array<string>} Array of category names
 */
export function getAllCategories() {
  return Object.keys(LAB_CATEGORIES);
}

/**
 * Get category keywords for a specific category
 * 
 * @param {string} category - Category name
 * @returns {Array<string>} Array of keywords
 */
export function getCategoryKeywords(category) {
  const config = LAB_CATEGORIES[category];
  return config ? config.keywords : [];
}

/**
 * Batch categorize multiple lab tests
 * 
 * @param {Array<Object>} tests - Array of test objects
 * @returns {Object} Categorization results with breakdown
 */
export function batchCategorizeLabTests(tests) {
  const results = {
    tests: [],
    breakdown: {}
  };

  // Initialize breakdown with all categories
  getAllCategories().forEach(category => {
    results.breakdown[category] = 0;
  });

  // Categorize each test
  tests.forEach((test, index) => {
    const category = categorizeLabTest(test);
    
    results.tests.push({
      row: index + 1,
      name: test.name || test.test_name || test['Test Name'],
      category: category,
      prefix: getCategoryPrefix(category)
    });
    
    results.breakdown[category]++;
  });

  return results;
}

export default {
  LAB_CATEGORIES,
  categorizeLabTest,
  getCategoryPrefix,
  getAllCategories,
  getCategoryKeywords,
  batchCategorizeLabTests
};
