/**
 * Batch Processor
 * 
 * Handles bulk database inserts with optimization and progress tracking.
 * Splits data into batches, executes inserts sequentially, and provides real-time progress updates.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 18.6
 */

import { supabase } from '../../lib/supabase.js';

/**
 * Batch processing status
 */
export const BatchStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Default batch configuration
 */
export const DEFAULT_BATCH_CONFIG = {
  batchSize: 50,
  delayBetweenBatches: 100, // ms
  retryAttempts: 3,
  retryDelay: 1000 // ms
};

/**
 * Create a batch processor instance
 * 
 * @param {Object} config - Batch processor configuration
 * @returns {Object} Batch processor instance
 */
export function createBatchProcessor(config = {}) {
  const {
    batchSize = DEFAULT_BATCH_CONFIG.batchSize,
    delayBetweenBatches = DEFAULT_BATCH_CONFIG.delayBetweenBatches,
    retryAttempts = DEFAULT_BATCH_CONFIG.retryAttempts,
    retryDelay = DEFAULT_BATCH_CONFIG.retryDelay
  } = config;

  let cancelled = false;

  return {
    batchSize,
    delayBetweenBatches,
    retryAttempts,
    retryDelay,
    cancel: () => { cancelled = true; },
    isCancelled: () => cancelled,
    reset: () => { cancelled = false; }
  };
}

/**
 * Split data into batches
 * 
 * @param {Array} data - Data to split
 * @param {number} batchSize - Size of each batch
 * @returns {Array} Array of batches
 */
export function splitIntoBatches(data, batchSize = DEFAULT_BATCH_CONFIG.batchSize) {
  const batches = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }
  
  return batches;
}

/**
 * Calculate batch progress
 * 
 * @param {number} currentBatch - Current batch index (0-based)
 * @param {number} totalBatches - Total number of batches
 * @param {number} processedRecords - Number of records processed so far
 * @param {number} totalRecords - Total number of records
 * @returns {Object} Progress information
 */
export function calculateProgress(currentBatch, totalBatches, processedRecords, totalRecords) {
  const percentage = totalRecords > 0 ? Math.round((processedRecords / totalRecords) * 100) : 0;
  
  return {
    currentBatch: currentBatch + 1, // 1-indexed for display
    totalBatches,
    processedRecords,
    totalRecords,
    percentage,
    remainingRecords: totalRecords - processedRecords,
    status: `Processing batch ${currentBatch + 1} of ${totalBatches}`
  };
}

/**
 * Delay execution for specified milliseconds
 * 
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a single batch insert with retry logic
 * 
 * @param {Function} insertFunction - Function to execute for batch insert
 * @param {Array} batch - Batch of data to insert
 * @param {number} retryAttempts - Number of retry attempts
 * @param {number} retryDelay - Delay between retries (ms)
 * @returns {Promise<Object>} Insert result
 */
async function executeBatchWithRetry(insertFunction, batch, retryAttempts, retryDelay) {
  let lastError = null;
  
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      const result = await insertFunction(batch);
      return { success: true, result, error: null };
    } catch (error) {
      lastError = error;
      
      if (attempt < retryAttempts) {
        // Wait before retrying (exponential backoff)
        await delay(retryDelay * Math.pow(2, attempt));
      }
    }
  }
  
  return { success: false, result: null, error: lastError };
}

/**
 * Process batches with progress tracking
 * 
 * @param {Array} data - Data to process
 * @param {Function} insertFunction - Function to execute for each batch
 * @param {Function} onProgress - Progress callback
 * @param {Object} config - Batch processor configuration
 * @returns {Promise<Object>} Batch processing result
 */
export async function processBatches(data, insertFunction, onProgress, config = {}) {
  const processor = createBatchProcessor(config);
  const batches = splitIntoBatches(data, processor.batchSize);
  const startTime = Date.now();
  
  let processedRecords = 0;
  let successfulRecords = 0;
  let failedRecords = 0;
  const errors = [];

  // Initial progress update
  if (onProgress) {
    onProgress(calculateProgress(0, batches.length, 0, data.length));
  }

  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    // Check if cancelled
    if (processor.isCancelled()) {
      return {
        status: BatchStatus.CANCELLED,
        totalProcessed: processedRecords,
        successful: successfulRecords,
        failed: failedRecords,
        duration: Date.now() - startTime,
        errors,
        cancelled: true
      };
    }

    const batch = batches[i];
    
    // Execute batch with retry logic
    const result = await executeBatchWithRetry(
      insertFunction,
      batch,
      processor.retryAttempts,
      processor.retryDelay
    );

    if (result.success) {
      successfulRecords += batch.length;
    } else {
      failedRecords += batch.length;
      errors.push({
        batchIndex: i,
        batchSize: batch.length,
        error: result.error.message || String(result.error),
        data: batch
      });
      
      // Stop processing on error (for transaction safety)
      return {
        status: BatchStatus.FAILED,
        totalProcessed: processedRecords,
        successful: successfulRecords,
        failed: failedRecords,
        duration: Date.now() - startTime,
        errors,
        failedBatch: i
      };
    }

    processedRecords += batch.length;

    // Update progress
    if (onProgress) {
      onProgress(calculateProgress(i, batches.length, processedRecords, data.length));
    }

    // Delay between batches to avoid overwhelming the database
    if (i < batches.length - 1 && processor.delayBetweenBatches > 0) {
      await delay(processor.delayBetweenBatches);
    }
  }

  const duration = Date.now() - startTime;

  return {
    status: BatchStatus.COMPLETED,
    totalProcessed: processedRecords,
    successful: successfulRecords,
    failed: failedRecords,
    duration,
    errors,
    averageTimePerRecord: duration / processedRecords,
    recordsPerSecond: (processedRecords / duration) * 1000
  };
}

/**
 * Bulk insert records into a Supabase table
 * 
 * @param {string} tableName - Table name
 * @param {Array} records - Records to insert
 * @returns {Promise} Insert result
 */
export async function bulkInsert(tableName, records) {
  const { data, error } = await supabase
    .from(tableName)
    .insert(records)
    .select();

  if (error) {
    throw new Error(`Bulk insert failed: ${error.message}`);
  }

  return data;
}

/**
 * Bulk update records in a Supabase table
 * 
 * @param {string} tableName - Table name
 * @param {Array} records - Records to update (must include id field)
 * @returns {Promise} Update result
 */
export async function bulkUpdate(tableName, records) {
  const results = [];
  
  // Supabase doesn't support bulk updates directly, so we do them individually
  // but within the same batch for consistency
  for (const record of records) {
    const { id, ...updateData } = record;
    
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw new Error(`Bulk update failed for record ${id}: ${error.message}`);
    }

    results.push(data[0]);
  }

  return results;
}

/**
 * Create a batch insert function for a specific table
 * 
 * @param {string} tableName - Table name
 * @returns {Function} Batch insert function
 */
export function createBatchInsertFunction(tableName) {
  return async (batch) => {
    return await bulkInsert(tableName, batch);
  };
}

/**
 * Create a batch update function for a specific table
 * 
 * @param {string} tableName - Table name
 * @returns {Function} Batch update function
 */
export function createBatchUpdateFunction(tableName) {
  return async (batch) => {
    return await bulkUpdate(tableName, batch);
  };
}

/**
 * Estimate processing time based on record count
 * 
 * @param {number} recordCount - Number of records to process
 * @param {number} batchSize - Batch size
 * @param {number} averageTimePerBatch - Average time per batch (ms)
 * @returns {Object} Time estimate
 */
export function estimateProcessingTime(recordCount, batchSize = DEFAULT_BATCH_CONFIG.batchSize, averageTimePerBatch = 200) {
  const batchCount = Math.ceil(recordCount / batchSize);
  const estimatedMs = batchCount * averageTimePerBatch;
  
  return {
    estimatedMs,
    estimatedSeconds: Math.ceil(estimatedMs / 1000),
    estimatedMinutes: Math.ceil(estimatedMs / 60000),
    batchCount
  };
}

/**
 * Format batch processing result for display
 * 
 * @param {Object} result - Batch processing result
 * @returns {string} Formatted result
 */
export function formatBatchResult(result) {
  const lines = [
    `Status: ${result.status}`,
    `Total Processed: ${result.totalProcessed}`,
    `Successful: ${result.successful}`,
    `Failed: ${result.failed}`,
    `Duration: ${(result.duration / 1000).toFixed(2)}s`
  ];

  if (result.recordsPerSecond) {
    lines.push(`Speed: ${result.recordsPerSecond.toFixed(2)} records/second`);
  }

  if (result.errors && result.errors.length > 0) {
    lines.push(`\nErrors:`);
    result.errors.forEach((error, index) => {
      lines.push(`  ${index + 1}. Batch ${error.batchIndex}: ${error.error}`);
    });
  }

  return lines.join('\n');
}

/**
 * Check if batch processing meets performance targets
 * 
 * @param {Object} result - Batch processing result
 * @param {number} recordCount - Number of records processed
 * @returns {Object} Performance check result
 */
export function checkPerformanceTargets(result, recordCount) {
  const durationSeconds = result.duration / 1000;
  
  // Performance targets from requirements:
  // 100 records: ≤ 10 seconds
  // 200 records: ≤ 20 seconds
  const targetSeconds = recordCount <= 100 ? 10 : 20;
  const meetsTarget = durationSeconds <= targetSeconds;

  return {
    meetsTarget,
    actualDuration: durationSeconds,
    targetDuration: targetSeconds,
    difference: durationSeconds - targetSeconds,
    recordsPerSecond: result.recordsPerSecond || 0
  };
}

/**
 * Create a progress tracker that updates at least once per second
 * 
 * @param {Function} onProgress - Progress callback
 * @returns {Object} Progress tracker
 */
export function createProgressTracker(onProgress) {
  let lastUpdate = 0;
  const minUpdateInterval = 1000; // 1 second

  return {
    update: (progress) => {
      const now = Date.now();
      
      // Always update on first call or if enough time has passed
      if (lastUpdate === 0 || now - lastUpdate >= minUpdateInterval) {
        onProgress(progress);
        lastUpdate = now;
      }
    },
    forceUpdate: (progress) => {
      onProgress(progress);
      lastUpdate = Date.now();
    }
  };
}

/**
 * Batch process with transaction support (requires RPC function)
 * 
 * @param {Array} data - Data to process
 * @param {string} importType - Type of import (patient, inventory, lab)
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Processing result
 */
export async function processBatchesWithTransaction(data, importType, onProgress) {
  // This would call a Supabase RPC function that handles the transaction
  // For now, we'll use the regular batch processing
  // In production, implement a server-side RPC function for true transactions
  
  try {
    const result = await processBatches(
      data,
      createBatchInsertFunction(getTableNameForImportType(importType)),
      onProgress
    );

    return result;
  } catch (error) {
    return {
      status: BatchStatus.FAILED,
      totalProcessed: 0,
      successful: 0,
      failed: data.length,
      duration: 0,
      errors: [{ error: error.message }]
    };
  }
}

/**
 * Get table name for import type
 * 
 * @param {string} importType - Import type
 * @returns {string} Table name
 */
function getTableNameForImportType(importType) {
  const tableMap = {
    'patient': 'patients',
    'inventory': 'inventory',
    'lab': 'services',
    'service': 'services'
  };

  return tableMap[importType] || importType;
}

/**
 * Monitor batch processing performance
 * 
 * @param {Function} processFunction - Function to monitor
 * @returns {Function} Wrapped function with performance monitoring
 */
export function withPerformanceMonitoring(processFunction) {
  return async (...args) => {
    const startTime = Date.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    try {
      const result = await processFunction(...args);
      
      const endTime = Date.now();
      const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      return {
        ...result,
        performance: {
          duration: endTime - startTime,
          memoryUsed: endMemory - startMemory,
          memoryUsedMB: ((endMemory - startMemory) / 1024 / 1024).toFixed(2)
        }
      };
    } catch (error) {
      const endTime = Date.now();
      
      throw {
        ...error,
        performance: {
          duration: endTime - startTime,
          failed: true
        }
      };
    }
  };
}
