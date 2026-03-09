/**
 * Retry Handler
 * 
 * Implements retry functionality with exponential backoff for network errors.
 * Detects retryable errors and provides retry mechanism with attempt tracking.
 * 
 * Requirements: 16.6
 */

import { isRetryableError, formatNetworkError } from './errorMessageFormatter.js';

/**
 * Retry configuration
 */
const DEFAULT_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 16000, // 16 seconds
  backoffMultiplier: 2,
  jitter: true // Add randomness to prevent thundering herd
};

/**
 * Calculate delay for next retry attempt using exponential backoff
 * 
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt, config = DEFAULT_CONFIG) {
  // Calculate exponential delay: initialDelay * (multiplier ^ attempt)
  let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  
  // Cap at maximum delay
  delay = Math.min(delay, config.maxDelay);
  
  // Add jitter (random variation) to prevent synchronized retries
  if (config.jitter) {
    const jitterAmount = delay * 0.1; // 10% jitter
    delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
  }
  
  return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds
 * 
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 * 
 * @param {Function} operation - Async function to retry
 * @param {Object} config - Retry configuration
 * @param {Function} onRetry - Callback for retry attempts (optional)
 * @returns {Promise} Result of successful operation
 * @throws {Error} Last error if all retries fail
 */
export async function retryWithBackoff(operation, config = DEFAULT_CONFIG, onRetry = null) {
  let lastError = null;
  
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      // Attempt the operation
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error; // Non-retryable error, fail immediately
      }
      
      // Check if we have more attempts left
      if (attempt < config.maxAttempts - 1) {
        const delay = calculateBackoffDelay(attempt, config);
        
        // Notify about retry
        if (onRetry) {
          onRetry({
            attempt: attempt + 1,
            maxAttempts: config.maxAttempts,
            delay,
            error: formatNetworkError(error)
          });
        }
        
        // Wait before retrying
        await sleep(delay);
      }
    }
  }
  
  // All retries exhausted
  throw lastError;
}

/**
 * Create a retry handler for import operations
 * 
 * @param {Object} config - Retry configuration
 * @returns {Object} Retry handler with state management
 */
export function createRetryHandler(config = DEFAULT_CONFIG) {
  let state = {
    isRetrying: false,
    currentAttempt: 0,
    maxAttempts: config.maxAttempts,
    lastError: null,
    retryHistory: []
  };
  
  return {
    /**
     * Execute operation with retry logic
     */
    async execute(operation, onProgress = null) {
      state.isRetrying = true;
      state.currentAttempt = 0;
      state.retryHistory = [];
      
      try {
        const result = await retryWithBackoff(
          operation,
          config,
          (retryInfo) => {
            state.currentAttempt = retryInfo.attempt;
            state.lastError = retryInfo.error;
            state.retryHistory.push({
              attempt: retryInfo.attempt,
              timestamp: new Date().toISOString(),
              error: retryInfo.error,
              delay: retryInfo.delay
            });
            
            if (onProgress) {
              onProgress({
                ...retryInfo,
                state: this.getState()
              });
            }
          }
        );
        
        state.isRetrying = false;
        return result;
      } catch (error) {
        state.isRetrying = false;
        state.lastError = formatNetworkError(error);
        throw error;
      }
    },
    
    /**
     * Get current retry state
     */
    getState() {
      return { ...state };
    },
    
    /**
     * Check if can retry
     */
    canRetry() {
      return state.currentAttempt < state.maxAttempts && 
             state.lastError && 
             isRetryableError(new Error(state.lastError));
    },
    
    /**
     * Reset retry state
     */
    reset() {
      state = {
        isRetrying: false,
        currentAttempt: 0,
        maxAttempts: config.maxAttempts,
        lastError: null,
        retryHistory: []
      };
    },
    
    /**
     * Get retry statistics
     */
    getStats() {
      return {
        totalAttempts: state.retryHistory.length,
        maxAttempts: state.maxAttempts,
        attemptsRemaining: state.maxAttempts - state.currentAttempt,
        lastError: state.lastError,
        retryHistory: state.retryHistory
      };
    }
  };
}

/**
 * Retry import operation with progress tracking
 * 
 * @param {Function} importOperation - Import function to retry
 * @param {Function} onProgress - Progress callback
 * @param {Object} config - Retry configuration
 * @returns {Promise} Import result
 */
export async function retryImport(importOperation, onProgress = null, config = DEFAULT_CONFIG) {
  const handler = createRetryHandler(config);
  
  return await handler.execute(importOperation, (retryInfo) => {
    if (onProgress) {
      onProgress({
        type: 'retry',
        attempt: retryInfo.attempt,
        maxAttempts: retryInfo.maxAttempts,
        delay: retryInfo.delay,
        error: retryInfo.error,
        message: `Retry attempt ${retryInfo.attempt} of ${retryInfo.maxAttempts}. Waiting ${Math.round(retryInfo.delay / 1000)}s...`
      });
    }
  });
}

/**
 * Create retry button state manager
 * 
 * @param {Function} onRetry - Callback when retry is triggered
 * @returns {Object} Retry button state manager
 */
export function createRetryButtonState(onRetry) {
  let state = {
    visible: false,
    enabled: true,
    attempt: 0,
    maxAttempts: DEFAULT_CONFIG.maxAttempts,
    error: null
  };
  
  return {
    /**
     * Show retry button
     */
    show(error, attempt = 0) {
      state.visible = true;
      state.enabled = attempt < DEFAULT_CONFIG.maxAttempts;
      state.attempt = attempt;
      state.error = formatNetworkError(error);
    },
    
    /**
     * Hide retry button
     */
    hide() {
      state.visible = false;
      state.enabled = true;
      state.attempt = 0;
      state.error = null;
    },
    
    /**
     * Disable retry button
     */
    disable() {
      state.enabled = false;
    },
    
    /**
     * Enable retry button
     */
    enable() {
      state.enabled = true;
    },
    
    /**
     * Handle retry click
     */
    async handleRetry() {
      if (!state.enabled) return;
      
      state.enabled = false;
      state.attempt++;
      
      try {
        await onRetry(state.attempt);
        this.hide();
      } catch (error) {
        if (state.attempt >= state.maxAttempts) {
          state.enabled = false;
          state.error = 'Maximum retry attempts reached. Please try again later.';
        } else if (isRetryableError(error)) {
          state.enabled = true;
          state.error = formatNetworkError(error);
        } else {
          this.hide();
          throw error;
        }
      }
    },
    
    /**
     * Get current state
     */
    getState() {
      return { ...state };
    },
    
    /**
     * Get retry button label
     */
    getLabel() {
      if (state.attempt === 0) {
        return 'Retry Import';
      }
      return `Retry (${state.attempt}/${state.maxAttempts})`;
    },
    
    /**
     * Get retry button message
     */
    getMessage() {
      if (!state.error) return '';
      
      const attemptsLeft = state.maxAttempts - state.attempt;
      if (attemptsLeft > 0) {
        return `${state.error} (${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining)`;
      }
      return state.error;
    }
  };
}

/**
 * Detect error type and determine if retry should be shown
 * 
 * @param {Error} error - Error object
 * @returns {Object} Error analysis
 */
export function analyzeError(error) {
  const isRetryable = isRetryableError(error);
  const errorMessage = formatNetworkError(error);
  
  return {
    isRetryable,
    isNetworkError: error.message?.includes('network') || error.message?.includes('fetch'),
    isDatabaseError: error.message?.includes('database') || error.message?.includes('constraint'),
    isValidationError: error.message?.includes('validation') || error.message?.includes('invalid'),
    errorMessage,
    shouldShowRetry: isRetryable,
    userMessage: isRetryable 
      ? `${errorMessage} Click "Retry" to try again.`
      : errorMessage
  };
}

/**
 * Format retry progress message
 * 
 * @param {number} attempt - Current attempt
 * @param {number} maxAttempts - Maximum attempts
 * @param {number} delay - Delay in milliseconds
 * @returns {string} Progress message
 */
export function formatRetryProgress(attempt, maxAttempts, delay) {
  const delaySeconds = Math.round(delay / 1000);
  return `Retry attempt ${attempt} of ${maxAttempts}. Waiting ${delaySeconds} second${delaySeconds > 1 ? 's' : ''}...`;
}

/**
 * Get backoff schedule for display
 * 
 * @param {Object} config - Retry configuration
 * @returns {Array} Array of delays for each attempt
 */
export function getBackoffSchedule(config = DEFAULT_CONFIG) {
  const schedule = [];
  for (let i = 0; i < config.maxAttempts; i++) {
    const delay = calculateBackoffDelay(i, { ...config, jitter: false });
    schedule.push({
      attempt: i + 1,
      delay,
      delaySeconds: Math.round(delay / 1000)
    });
  }
  return schedule;
}

/**
 * Create retry statistics for logging
 * 
 * @param {Array} retryHistory - History of retry attempts
 * @returns {Object} Retry statistics
 */
export function createRetryStats(retryHistory) {
  if (!retryHistory || retryHistory.length === 0) {
    return {
      totalRetries: 0,
      totalDelay: 0,
      averageDelay: 0,
      success: true
    };
  }
  
  const totalDelay = retryHistory.reduce((sum, entry) => sum + entry.delay, 0);
  
  return {
    totalRetries: retryHistory.length,
    totalDelay,
    totalDelaySeconds: Math.round(totalDelay / 1000),
    averageDelay: Math.round(totalDelay / retryHistory.length),
    averageDelaySeconds: Math.round(totalDelay / retryHistory.length / 1000),
    attempts: retryHistory.map(entry => ({
      attempt: entry.attempt,
      timestamp: entry.timestamp,
      error: entry.error,
      delaySeconds: Math.round(entry.delay / 1000)
    })),
    success: true
  };
}

export default {
  retryWithBackoff,
  createRetryHandler,
  retryImport,
  createRetryButtonState,
  analyzeError,
  formatRetryProgress,
  getBackoffSchedule,
  createRetryStats,
  DEFAULT_CONFIG
};
