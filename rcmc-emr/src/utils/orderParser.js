/**
 * Order Parser Utility
 * 
 * Extracts medical orders from SOAP treatment text and formats them back to human-readable text.
 * Supports medication, lab test, procedure, diet, and activity restriction orders.
 * Detects priority levels: stat, urgent, routine.
 */

/**
 * Order type patterns with keywords and regex
 */
const ORDER_PATTERNS = {
  medication: {
    keywords: ['prescribe', 'medication', 'drug', 'rx', 'give', 'administer'],
    regex: /\b(prescribe|medication|drug|rx|give|administer)\b/i
  },
  lab_test: {
    keywords: ['order', 'test', 'lab', 'check', 'screen', 'blood work', 'urinalysis', 'culture'],
    regex: /\b(order|test|lab|check|screen|blood work|urinalysis|culture)\b/i
  },
  procedure: {
    keywords: ['procedure', 'perform', 'schedule', 'refer', 'surgery', 'imaging', 'x-ray', 'ct scan', 'mri', 'ultrasound'],
    regex: /\b(procedure|perform|schedule|refer|surgery|imaging|x-ray|ct scan|mri|ultrasound)\b/i
  },
  diet: {
    keywords: ['diet', 'nutrition', 'npo', 'clear liquids', 'restrict intake', 'food', 'meal', 'feeding'],
    regex: /\b(diet|nutrition|npo|clear liquids|restrict intake|food|meal|feeding)\b/i
  },
  activity_restriction: {
    keywords: ['restrict', 'avoid', 'bed rest', 'ambulate', 'physical therapy', 'exercise', 'activity', 'mobility'],
    regex: /\b(restrict|avoid|bed rest|ambulate|physical therapy|exercise|activity|mobility)\b/i
  }
};

/**
 * Priority patterns
 */
const PRIORITY_PATTERNS = {
  stat: /\b(stat|immediately|emergency|urgent now|asap)\b/i,
  urgent: /\b(urgent|soon|priority|expedite)\b/i,
  routine: /\b(routine|regular|standard|when available)\b/i
};

/**
 * Parse treatment text and extract orders
 * 
 * @param {string} treatmentText - The SOAP treatment text to parse
 * @returns {Array<ParsedOrder>} Array of parsed orders with type, details, priority, confidence, sourceText
 */
export function parseOrders(treatmentText) {
  if (!treatmentText || typeof treatmentText !== 'string') {
    return [];
  }

  const orders = [];
  
  // Split text into sentences (by period, newline, or semicolon)
  const sentences = treatmentText
    .split(/[.\n;]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const sentence of sentences) {
    const order = parseOrderFromSentence(sentence);
    if (order) {
      orders.push(order);
    }
  }

  return orders;
}

/**
 * Parse a single sentence to extract an order
 * 
 * @param {string} sentence - A single sentence from treatment text
 * @returns {ParsedOrder|null} Parsed order or null if no order detected
 */
function parseOrderFromSentence(sentence) {
  // Detect order type
  const orderType = detectOrderType(sentence);
  if (!orderType) {
    return null;
  }

  // Detect priority
  const priority = detectPriority(sentence);

  // Calculate confidence based on keyword matches
  const confidence = calculateConfidence(sentence, orderType);

  // Clean up the sentence for details
  const details = sentence.trim();

  return {
    type: orderType,
    details: details,
    priority: priority,
    confidence: confidence,
    sourceText: sentence
  };
}

/**
 * Detect order type from sentence
 * 
 * @param {string} sentence - Sentence to analyze
 * @returns {string|null} Order type or null if none detected
 */
function detectOrderType(sentence) {
  const lowerSentence = sentence.toLowerCase();
  
  // Check each order type pattern
  for (const [type, pattern] of Object.entries(ORDER_PATTERNS)) {
    if (pattern.regex.test(lowerSentence)) {
      return type;
    }
  }

  return null;
}

/**
 * Detect priority level from sentence
 * 
 * @param {string} sentence - Sentence to analyze
 * @returns {string} Priority level: 'stat', 'urgent', or 'routine'
 */
function detectPriority(sentence) {
  const lowerSentence = sentence.toLowerCase();

  // Check in order of priority (stat > urgent > routine)
  if (PRIORITY_PATTERNS.stat.test(lowerSentence)) {
    return 'stat';
  }
  if (PRIORITY_PATTERNS.urgent.test(lowerSentence)) {
    return 'urgent';
  }
  if (PRIORITY_PATTERNS.routine.test(lowerSentence)) {
    return 'routine';
  }

  // Default to routine if no priority specified
  return 'routine';
}

/**
 * Calculate confidence score for order detection
 * 
 * @param {string} sentence - Sentence to analyze
 * @param {string} orderType - Detected order type
 * @returns {number} Confidence score between 0 and 1
 */
function calculateConfidence(sentence, orderType) {
  const lowerSentence = sentence.toLowerCase();
  const pattern = ORDER_PATTERNS[orderType];
  
  if (!pattern) {
    return 0;
  }

  // Count keyword matches
  let matchCount = 0;
  for (const keyword of pattern.keywords) {
    if (lowerSentence.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }

  // Base confidence on number of matches and sentence length
  const baseConfidence = Math.min(matchCount / 2, 1); // Max at 2 keyword matches
  const lengthFactor = Math.min(sentence.length / 50, 1); // Longer sentences are more likely to be orders
  
  return Math.min((baseConfidence * 0.7 + lengthFactor * 0.3), 1);
}

/**
 * Format an order object back to human-readable text
 * 
 * @param {Object} order - Order object with type, details, priority, etc.
 * @returns {string} Human-readable formatted order text
 */
export function formatOrder(order) {
  if (!order || !order.order_type || !order.order_details) {
    return '';
  }

  const typeLabels = {
    medication: 'Medication',
    lab_test: 'Lab Test',
    procedure: 'Procedure',
    diet: 'Diet',
    activity_restriction: 'Activity Restriction'
  };

  const priorityLabels = {
    stat: 'STAT',
    urgent: 'URGENT',
    routine: 'Routine'
  };

  const typeLabel = typeLabels[order.order_type] || order.order_type;
  const priorityLabel = priorityLabels[order.priority] || order.priority;

  // Format: [PRIORITY] Type: Details
  let formatted = '';
  
  if (order.priority !== 'routine') {
    formatted += `[${priorityLabel}] `;
  }
  
  formatted += `${typeLabel}: ${order.order_details}`;

  return formatted;
}

/**
 * Type definitions for reference
 * 
 * @typedef {Object} ParsedOrder
 * @property {string} type - Order type: 'medication', 'lab_test', 'procedure', 'diet', 'activity_restriction'
 * @property {string} details - Order details text
 * @property {string} priority - Priority level: 'stat', 'urgent', 'routine'
 * @property {number} confidence - Confidence score 0-1
 * @property {string} sourceText - Original text snippet
 */
