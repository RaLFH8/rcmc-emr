/**
 * Configuration Parser and Validator
 * 
 * Provides parsing, validation, and serialization for dashboard configuration data.
 * Supports schema versioning and migration for backward compatibility.
 * 
 * Validates: Requirements 13.1-13.10
 */

const CURRENT_SCHEMA_VERSION = 1;

/**
 * Configuration schema definition
 */
const SCHEMA = {
  baseline_metrics: {
    required: true,
    fields: {
      patientSatisfaction: { type: 'number', min: 0, max: 5, required: true },
      recoveryRate: { type: 'number', min: 0, max: 5, required: true },
      emergencyResponse: { type: 'number', min: 0, max: 5, required: true },
      followUpRate: { type: 'number', min: 0, max: 5, required: true },
      treatmentSuccess: { type: 'number', min: 0, max: 5, required: true }
    }
  },
  expense_budgets: {
    required: true,
    fields: {
      staff_salaries: { type: 'number', min: 0, max: 100000000, required: true },
      operational_costs: { type: 'number', min: 0, max: 100000000, required: true }
    }
  }
};

/**
 * Parse JSON configuration into typed objects
 * 
 * @param {string} json - JSON string to parse
 * @returns {Object} Parsed configuration object
 * @throws {Error} If JSON is invalid or parsing fails
 * 
 * Validates: Requirement 13.2
 */
export function parseConfiguration(json) {
  try {
    if (typeof json === 'string') {
      return JSON.parse(json);
    }
    
    // If already an object, return as-is
    if (typeof json === 'object' && json !== null) {
      return json;
    }
    
    throw new Error('Invalid configuration format: expected JSON string or object');
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON syntax: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Format configuration object back to JSON
 * 
 * @param {Object} config - Configuration object
 * @returns {string} JSON string
 * @throws {Error} If serialization fails
 * 
 * Validates: Requirement 13.6
 */
export function printConfiguration(config) {
  try {
    return JSON.stringify(config, null, 2);
  } catch (error) {
    throw new Error(`Failed to serialize configuration: ${error.message}`);
  }
}

/**
 * Validate field value against schema
 * 
 * @param {*} value - Value to validate
 * @param {Object} fieldSchema - Field schema definition
 * @param {string} fieldName - Field name for error messages
 * @returns {Object} { valid: boolean, error: string }
 */
function validateField(value, fieldSchema, fieldName) {
  // Check if required
  if (fieldSchema.required && (value === null || value === undefined)) {
    return {
      valid: false,
      error: `Required field '${fieldName}' is missing`
    };
  }
  
  // If not required and missing, that's okay
  if (!fieldSchema.required && (value === null || value === undefined)) {
    return { valid: true, error: null };
  }
  
  // Check type
  if (fieldSchema.type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        valid: false,
        error: `Field '${fieldName}' must be a number, got ${typeof value}`
      };
    }
    
    // Check range
    if (fieldSchema.min !== undefined && value < fieldSchema.min) {
      return {
        valid: false,
        error: `Field '${fieldName}' must be >= ${fieldSchema.min}, got ${value}`
      };
    }
    
    if (fieldSchema.max !== undefined && value > fieldSchema.max) {
      return {
        valid: false,
        error: `Field '${fieldName}' must be <= ${fieldSchema.max}, got ${value}`
      };
    }
  } else if (fieldSchema.type === 'string') {
    if (typeof value !== 'string') {
      return {
        valid: false,
        error: `Field '${fieldName}' must be a string, got ${typeof value}`
      };
    }
  }
  
  return { valid: true, error: null };
}

/**
 * Validate configuration object against schema
 * 
 * @param {Object} config - Configuration object to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 * 
 * Validates: Requirements 13.3, 13.4, 13.5
 */
export function validateConfiguration(config) {
  const errors = [];
  
  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: ['Configuration must be an object']
    };
  }
  
  // Validate each section in schema
  for (const [sectionName, sectionSchema] of Object.entries(SCHEMA)) {
    const section = config[sectionName];
    
    // Check if required section exists
    if (sectionSchema.required && !section) {
      errors.push(`Required section '${sectionName}' is missing`);
      continue;
    }
    
    // If section exists, validate its fields
    if (section) {
      if (typeof section !== 'object') {
        errors.push(`Section '${sectionName}' must be an object`);
        continue;
      }
      
      // Validate each field in the section
      for (const [fieldName, fieldSchema] of Object.entries(sectionSchema.fields)) {
        const value = section[fieldName];
        const validation = validateField(value, fieldSchema, `${sectionName}.${fieldName}`);
        
        if (!validation.valid) {
          errors.push(validation.error);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Migrate configuration from older schema version to current version
 * 
 * @param {Object} config - Configuration object
 * @param {number} fromVersion - Source schema version
 * @returns {Object} Migrated configuration
 * 
 * Validates: Requirements 13.8, 13.9
 */
export function migrateConfiguration(config, fromVersion) {
  let migratedConfig = { ...config };
  
  // Migration path from version 0 to 1
  if (fromVersion < 1) {
    // Add default values for any missing fields
    if (!migratedConfig.baseline_metrics) {
      migratedConfig.baseline_metrics = {
        patientSatisfaction: 4.2,
        recoveryRate: 4.5,
        emergencyResponse: 3.8,
        followUpRate: 4.0,
        treatmentSuccess: 4.3
      };
    }
    
    if (!migratedConfig.expense_budgets) {
      migratedConfig.expense_budgets = {
        staff_salaries: 500000,
        operational_costs: 200000
      };
    }
  }
  
  // Future migrations would go here
  // if (fromVersion < 2) { ... }
  
  return migratedConfig;
}

/**
 * Get schema version from configuration
 * 
 * @param {Object} config - Configuration object
 * @returns {number} Schema version (defaults to 0 if not specified)
 */
export function getSchemaVersion(config) {
  return config.schema_version || 0;
}

/**
 * Set schema version on configuration
 * 
 * @param {Object} config - Configuration object
 * @param {number} version - Schema version to set
 * @returns {Object} Configuration with version set
 */
export function setSchemaVersion(config, version) {
  return {
    ...config,
    schema_version: version
  };
}

/**
 * Parse and validate configuration with automatic migration
 * 
 * @param {string|Object} json - JSON string or object to parse
 * @returns {Object} { valid: boolean, config: Object, errors: string[] }
 * 
 * Validates: Requirements 13.1-13.10
 */
export function parseAndValidate(json) {
  try {
    // Parse JSON
    let config = parseConfiguration(json);
    
    // Check schema version and migrate if needed
    const version = getSchemaVersion(config);
    if (version < CURRENT_SCHEMA_VERSION) {
      config = migrateConfiguration(config, version);
      config = setSchemaVersion(config, CURRENT_SCHEMA_VERSION);
    }
    
    // Validate
    const validation = validateConfiguration(config);
    
    return {
      valid: validation.valid,
      config: validation.valid ? config : null,
      errors: validation.errors
    };
  } catch (error) {
    return {
      valid: false,
      config: null,
      errors: [error.message]
    };
  }
}

/**
 * Create default configuration
 * 
 * @returns {Object} Default configuration object
 */
export function createDefaultConfiguration() {
  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    baseline_metrics: {
      patientSatisfaction: 4.2,
      recoveryRate: 4.5,
      emergencyResponse: 3.8,
      followUpRate: 4.0,
      treatmentSuccess: 4.3
    },
    expense_budgets: {
      staff_salaries: 500000,
      operational_costs: 200000
    }
  };
}

export default {
  parseConfiguration,
  printConfiguration,
  validateConfiguration,
  migrateConfiguration,
  parseAndValidate,
  getSchemaVersion,
  setSchemaVersion,
  createDefaultConfiguration,
  CURRENT_SCHEMA_VERSION
};
