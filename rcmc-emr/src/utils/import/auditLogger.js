/**
 * Audit Logger for Import Operations
 * 
 * Provides comprehensive audit logging for all CSV import operations.
 * Logs are stored in the import_logs table for compliance, troubleshooting,
 * and security monitoring.
 * 
 * Features:
 * - Start/end time tracking
 * - Duration calculation
 * - Record count tracking (total, successful, failed, skipped)
 * - Category breakdown for inventory and lab test imports
 * - Detailed error logging with stack traces
 * - User tracking (ID and username)
 * - Module type tracking (patient, inventory, lab_test)
 * - Source filename tracking
 * 
 * Requirements: 7.7, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7
 */

import { supabase } from '../../lib/supabase';

/**
 * Start an import operation and create initial audit log entry
 * 
 * @param {Object} params - Import parameters
 * @param {string} params.moduleType - Type of import: 'patient', 'inventory', or 'lab_test'
 * @param {string} params.filename - Original CSV filename
 * @param {number} params.totalRecords - Total number of records to import
 * @param {string} params.userId - User ID performing the import
 * @param {string} params.username - Username performing the import
 * @returns {Promise<string>} Import log ID
 */
export async function startImportLog({ moduleType, filename, totalRecords, userId, username }) {
  try {
    const { data, error } = await supabase
      .from('import_logs')
      .insert({
        user_id: userId,
        username: username,
        module_type: moduleType,
        filename: filename,
        start_time: new Date().toISOString(),
        total_records: totalRecords,
        successful_records: 0,
        failed_records: 0,
        skipped_records: 0,
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create import log:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error starting import log:', error);
    // Don't throw - logging failure shouldn't stop the import
    return null;
  }
}

/**
 * Update import log with progress information
 * 
 * @param {string} logId - Import log ID
 * @param {Object} progress - Progress information
 * @param {number} progress.successfulRecords - Number of successful records
 * @param {number} progress.failedRecords - Number of failed records
 * @param {number} progress.skippedRecords - Number of skipped records
 * @param {Object} progress.categoryBreakdown - Category breakdown (optional)
 * @returns {Promise<void>}
 */
export async function updateImportLog(logId, progress) {
  if (!logId) return;

  try {
    const updateData = {
      successful_records: progress.successfulRecords || 0,
      failed_records: progress.failedRecords || 0,
      skipped_records: progress.skippedRecords || 0
    };

    if (progress.categoryBreakdown) {
      updateData.category_breakdown = progress.categoryBreakdown;
    }

    const { error } = await supabase
      .from('import_logs')
      .update(updateData)
      .eq('id', logId);

    if (error) {
      console.error('Failed to update import log:', error);
    }
  } catch (error) {
    console.error('Error updating import log:', error);
    // Don't throw - logging failure shouldn't stop the import
  }
}

/**
 * Complete import log with final results
 * 
 * @param {string} logId - Import log ID
 * @param {Object} results - Final import results
 * @param {number} results.successful - Number of successful records
 * @param {number} results.failed - Number of failed records
 * @param {number} results.skipped - Number of skipped records
 * @param {Object} results.categoryBreakdown - Category breakdown (optional)
 * @param {Array} results.errors - Array of error objects (optional)
 * @param {string} results.status - Final status: 'completed' or 'failed'
 * @returns {Promise<void>}
 */
export async function completeImportLog(logId, results) {
  if (!logId) return;

  try {
    const endTime = new Date();
    
    // Get start time to calculate duration
    const { data: logData, error: fetchError } = await supabase
      .from('import_logs')
      .select('start_time')
      .eq('id', logId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch import log for completion:', fetchError);
      return;
    }

    const startTime = new Date(logData.start_time);
    const durationMs = endTime - startTime;

    const updateData = {
      end_time: endTime.toISOString(),
      duration_ms: durationMs,
      successful_records: results.successful || 0,
      failed_records: results.failed || 0,
      skipped_records: results.skipped || 0,
      status: results.status || 'completed'
    };

    if (results.categoryBreakdown) {
      updateData.category_breakdown = results.categoryBreakdown;
    }

    if (results.errors && results.errors.length > 0) {
      updateData.error_details = results.errors;
    }

    const { error } = await supabase
      .from('import_logs')
      .update(updateData)
      .eq('id', logId);

    if (error) {
      console.error('Failed to complete import log:', error);
    }
  } catch (error) {
    console.error('Error completing import log:', error);
    // Don't throw - logging failure shouldn't stop the import
  }
}

/**
 * Log an error during import operation
 * 
 * @param {string} logId - Import log ID
 * @param {Object} errorInfo - Error information
 * @param {number} errorInfo.row - Row number where error occurred
 * @param {Object} errorInfo.data - Row data that caused the error
 * @param {string} errorInfo.error - Error message
 * @param {string} errorInfo.stack - Error stack trace (optional)
 * @returns {Promise<void>}
 */
export async function logError(logId, errorInfo) {
  if (!logId) return;

  try {
    // Get current error details
    const { data: logData, error: fetchError } = await supabase
      .from('import_logs')
      .select('error_details, failed_records')
      .eq('id', logId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch import log for error logging:', fetchError);
      return;
    }

    // Append new error to existing errors
    const currentErrors = logData.error_details || [];
    const newError = {
      row: errorInfo.row,
      data: errorInfo.data,
      error: errorInfo.error,
      timestamp: new Date().toISOString()
    };

    // Include stack trace if available
    if (errorInfo.stack) {
      newError.stack = errorInfo.stack;
    }

    currentErrors.push(newError);

    // Update log with new error
    const { error } = await supabase
      .from('import_logs')
      .update({
        error_details: currentErrors,
        failed_records: (logData.failed_records || 0) + 1
      })
      .eq('id', logId);

    if (error) {
      console.error('Failed to log error:', error);
    }
  } catch (error) {
    console.error('Error logging error:', error);
    // Don't throw - logging failure shouldn't stop the import
  }
}

/**
 * Mark import as failed with error message
 * 
 * @param {string} logId - Import log ID
 * @param {string} errorMessage - Error message
 * @param {string} errorStack - Error stack trace (optional)
 * @returns {Promise<void>}
 */
export async function failImportLog(logId, errorMessage, errorStack = null) {
  if (!logId) return;

  try {
    const endTime = new Date();
    
    // Get start time to calculate duration
    const { data: logData, error: fetchError } = await supabase
      .from('import_logs')
      .select('start_time, error_details')
      .eq('id', logId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch import log for failure:', fetchError);
      return;
    }

    const startTime = new Date(logData.start_time);
    const durationMs = endTime - startTime;

    // Add failure error to error details
    const currentErrors = logData.error_details || [];
    const failureError = {
      type: 'import_failure',
      error: errorMessage,
      timestamp: endTime.toISOString()
    };

    if (errorStack) {
      failureError.stack = errorStack;
    }

    currentErrors.push(failureError);

    const { error } = await supabase
      .from('import_logs')
      .update({
        end_time: endTime.toISOString(),
        duration_ms: durationMs,
        status: 'failed',
        error_details: currentErrors
      })
      .eq('id', logId);

    if (error) {
      console.error('Failed to mark import as failed:', error);
    }
  } catch (error) {
    console.error('Error failing import log:', error);
    // Don't throw - logging failure shouldn't stop the import
  }
}

/**
 * Get import logs with optional filtering
 * 
 * @param {Object} filters - Filter options
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.moduleType - Filter by module type
 * @param {string} filters.status - Filter by status
 * @param {Date} filters.startDate - Filter by start date (from)
 * @param {Date} filters.endDate - Filter by end date (to)
 * @param {number} filters.limit - Limit number of results (default: 50)
 * @returns {Promise<Array>} Array of import logs
 */
export async function getImportLogs(filters = {}) {
  try {
    let query = supabase
      .from('import_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.moduleType) {
      query = query.eq('module_type', filters.moduleType);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('start_time', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('start_time', filters.endDate.toISOString());
    }

    const limit = filters.limit || 50;
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch import logs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching import logs:', error);
    throw error;
  }
}

/**
 * Get import log statistics
 * 
 * @param {Object} filters - Filter options (same as getImportLogs)
 * @returns {Promise<Object>} Statistics object
 */
export async function getImportStatistics(filters = {}) {
  try {
    const logs = await getImportLogs({ ...filters, limit: 1000 });

    const stats = {
      totalImports: logs.length,
      completedImports: 0,
      failedImports: 0,
      inProgressImports: 0,
      totalRecordsProcessed: 0,
      totalSuccessfulRecords: 0,
      totalFailedRecords: 0,
      totalSkippedRecords: 0,
      averageDuration: 0,
      byModule: {
        patient: { count: 0, successful: 0, failed: 0 },
        inventory: { count: 0, successful: 0, failed: 0 },
        lab_test: { count: 0, successful: 0, failed: 0 }
      }
    };

    let totalDuration = 0;
    let completedCount = 0;

    logs.forEach(log => {
      // Status counts
      if (log.status === 'completed') stats.completedImports++;
      else if (log.status === 'failed') stats.failedImports++;
      else if (log.status === 'in_progress') stats.inProgressImports++;

      // Record counts
      stats.totalRecordsProcessed += log.total_records || 0;
      stats.totalSuccessfulRecords += log.successful_records || 0;
      stats.totalFailedRecords += log.failed_records || 0;
      stats.totalSkippedRecords += log.skipped_records || 0;

      // Duration
      if (log.duration_ms) {
        totalDuration += log.duration_ms;
        completedCount++;
      }

      // By module
      if (log.module_type && stats.byModule[log.module_type]) {
        stats.byModule[log.module_type].count++;
        stats.byModule[log.module_type].successful += log.successful_records || 0;
        stats.byModule[log.module_type].failed += log.failed_records || 0;
      }
    });

    // Calculate average duration
    if (completedCount > 0) {
      stats.averageDuration = Math.round(totalDuration / completedCount);
    }

    return stats;
  } catch (error) {
    console.error('Error calculating import statistics:', error);
    throw error;
  }
}

export default {
  startImportLog,
  updateImportLog,
  completeImportLog,
  logError,
  failImportLog,
  getImportLogs,
  getImportStatistics
};
