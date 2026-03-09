/**
 * Metric Calculations and Formatting Utilities
 * 
 * This module provides utility functions for calculating and formatting
 * KPI metrics for the Advanced Analytics Dashboard.
 * 
 * Requirements: 1.7, 1.10, 1.11, 1.12, 11.2, 11.3, 11.9, 11.10, 11.11, 11.12, 11.13
 */

/**
 * Calculate percentage change between current and previous values
 * 
 * Formula: ((current - previous) / previous) * 100
 * 
 * Handles edge cases:
 * - Null/undefined values default to 0
 * - Division by zero returns 0
 * - Bounds validation: -100% to +1000%
 * - Out-of-bounds returns "Significant Change"
 * 
 * @param {number} current - Current period value
 * @param {number} previous - Previous period value
 * @returns {number|string} Percentage change or "Significant Change"
 * 
 * Requirements: 1.7, 11.2, 11.3, 11.9, 11.10
 */
export function calculatePercentageChange(current, previous) {
  // Handle null/undefined with zero defaults (Requirement 11.2, 11.3)
  const currentValue = current ?? 0
  const previousValue = previous ?? 0
  
  // Handle division by zero
  if (previousValue === 0) {
    if (currentValue === 0) {
      return 0
    }
    // If previous is 0 but current is not, it's infinite growth
    return "Significant Change"
  }
  
  // Calculate percentage change
  const percentageChange = ((currentValue - previousValue) / previousValue) * 100
  
  // Bounds validation: -100% to +1000% (Requirement 11.9, 11.10)
  if (percentageChange < -100 || percentageChange > 1000) {
    return "Significant Change"
  }
  
  return percentageChange
}

/**
 * Format currency value with Philippine Peso symbol and thousand separators
 * 
 * Format: ₱X,XXX,XXX.XX
 * 
 * Handles edge cases:
 * - Null/undefined values default to 0
 * - Rounds to 2 decimal places
 * - Adds thousand separators
 * 
 * @param {number} value - Numeric value to format
 * @returns {string} Formatted currency string
 * 
 * Requirements: 1.10, 11.2, 11.3, 11.11
 */
export function formatCurrency(value) {
  // Handle null/undefined with zero default (Requirement 11.2, 11.3)
  const numericValue = value ?? 0
  
  // Round to 2 decimal places (Requirement 11.11)
  const rounded = Math.round(numericValue * 100) / 100
  
  // Format with thousand separators and 2 decimal places
  const formatted = rounded.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  return `₱${formatted}`
}

/**
 * Format percentage value with 1 decimal place precision
 * 
 * Format: XX.X%
 * 
 * Handles edge cases:
 * - Null/undefined values default to 0
 * - Rounds to 1 decimal place
 * - Handles "Significant Change" string
 * 
 * @param {number|string} value - Numeric value or "Significant Change"
 * @returns {string} Formatted percentage string
 * 
 * Requirements: 1.11, 11.2, 11.3, 11.12
 */
export function formatPercentage(value) {
  // Handle "Significant Change" string
  if (value === "Significant Change") {
    return "Significant Change"
  }
  
  // Handle null/undefined with zero default (Requirement 11.2, 11.3)
  const numericValue = value ?? 0
  
  // Round to 1 decimal place (Requirement 11.12)
  const rounded = Math.round(numericValue * 10) / 10
  
  return `${rounded.toFixed(1)}%`
}

/**
 * Format satisfaction score as X.X/5.0
 * 
 * Format: X.X/5.0
 * 
 * Handles edge cases:
 * - Null/undefined values default to 0
 * - Rounds to 1 decimal place
 * - Clamps value between 0 and 5
 * 
 * @param {number} value - Satisfaction score (0-5 scale)
 * @returns {string} Formatted satisfaction score
 * 
 * Requirements: 1.12, 11.2, 11.3, 11.13
 */
export function formatSatisfactionScore(value) {
  // Handle null/undefined with zero default (Requirement 11.2, 11.3)
  const numericValue = value ?? 0
  
  // Clamp value between 0 and 5
  const clamped = Math.max(0, Math.min(5, numericValue))
  
  // Round to 1 decimal place (Requirement 11.13)
  const rounded = Math.round(clamped * 10) / 10
  
  return `${rounded.toFixed(1)}/5.0`
}
