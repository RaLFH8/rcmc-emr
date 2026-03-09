/**
 * Result Exporter
 * 
 * Provides functionality to export import results and errors to CSV format.
 * Supports results summary, error reports, and category breakdowns.
 * 
 * Requirements: 9.7, 9.8
 */

import { printCSV } from './csvPrettyPrinter.js';

/**
 * Export import results summary to CSV
 * 
 * @param {Object} result - Import result object
 * @returns {string} CSV string
 */
export function exportResultsToCSV(result) {
  const {
    totalRecords = 0,
    successful = 0,
    skipped = 0,
    failed = 0,
    duration = 0,
    timestamp = new Date().toISOString(),
    userId = 'Unknown',
    categoryBreakdown = null
  } = result;

  const summaryData = [
    { Metric: 'Total Records', Value: totalRecords },
    { Metric: 'Successful', Value: successful },
    { Metric: 'Skipped', Value: skipped },
    { Metric: 'Failed', Value: failed },
    { Metric: 'Success Rate', Value: `${((successful / totalRecords) * 100).toFixed(2)}%` },
    { Metric: 'Duration (seconds)', Value: (duration / 1000).toFixed(2) },
    { Metric: 'Import Timestamp', Value: timestamp },
    { Metric: 'User ID', Value: userId }
  ];

  let csv = printCSV(summaryData);

  // Add category breakdown if available
  if (categoryBreakdown && Object.keys(categoryBreakdown).length > 0) {
    csv += '\n\nCategory Breakdown\n';
    const categoryData = Object.entries(categoryBreakdown).map(([category, count]) => ({
      Category: category,
      Count: count
    }));
    csv += printCSV(categoryData);
  }

  return csv;
}

/**
 * Export import errors to CSV
 * 
 * @param {Array} errors - Array of error objects
 * @returns {string} CSV string
 */
export function exportErrorsToCSV(errors) {
  if (!errors || errors.length === 0) {
    return 'No errors to export\n';
  }

  const errorData = errors.map(error => ({
    'Batch Index': error.batchIndex || 'N/A',
    'Batch Size': error.batchSize || 'N/A',
    'Error Message': error.error || error.message || 'Unknown error',
    'Row Data': error.data ? JSON.stringify(error.data) : 'N/A'
  }));

  return printCSV(errorData);
}

/**
 * Export category breakdown to CSV
 * 
 * @param {Object} categoryBreakdown - Category breakdown object
 * @param {string} categoryType - Type of categories (e.g., 'Inventory', 'Lab Tests')
 * @returns {string} CSV string
 */
export function exportCategoryBreakdownToCSV(categoryBreakdown, categoryType = 'Category') {
  if (!categoryBreakdown || Object.keys(categoryBreakdown).length === 0) {
    return `No ${categoryType} breakdown available\n`;
  }

  const data = Object.entries(categoryBreakdown).map(([category, count]) => ({
    [categoryType]: category,
    Count: count,
    Percentage: categoryBreakdown.total 
      ? `${((count / categoryBreakdown.total) * 100).toFixed(2)}%`
      : 'N/A'
  }));

  return printCSV(data);
}

/**
 * Create downloadable CSV file from result data
 * 
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Filename for download
 * @returns {Object} Blob and download URL
 */
export function createResultCSVDownload(csvContent, filename = 'import-results.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  return {
    blob,
    url,
    filename,
    download: () => {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
}

/**
 * Download import results as CSV file
 * 
 * @param {Object} result - Import result object
 * @param {string} filename - Optional filename
 */
export function downloadResultsCSV(result, filename = null) {
  const csvContent = exportResultsToCSV(result);
  const defaultFilename = generateResultFilename('import-results');
  const download = createResultCSVDownload(csvContent, filename || defaultFilename);
  download.download();
}

/**
 * Download import errors as CSV file
 * 
 * @param {Array} errors - Array of error objects
 * @param {string} filename - Optional filename
 */
export function downloadErrorsCSV(errors, filename = null) {
  const csvContent = exportErrorsToCSV(errors);
  const defaultFilename = generateResultFilename('import-errors');
  const download = createResultCSVDownload(csvContent, filename || defaultFilename);
  download.download();
}

/**
 * Download category breakdown as CSV file
 * 
 * @param {Object} categoryBreakdown - Category breakdown object
 * @param {string} categoryType - Type of categories
 * @param {string} filename - Optional filename
 */
export function downloadCategoryBreakdownCSV(categoryBreakdown, categoryType = 'Category', filename = null) {
  const csvContent = exportCategoryBreakdownToCSV(categoryBreakdown, categoryType);
  const defaultFilename = generateResultFilename('category-breakdown');
  const download = createResultCSVDownload(csvContent, filename || defaultFilename);
  download.download();
}

/**
 * Generate timestamped filename for result export
 * 
 * @param {string} prefix - Filename prefix
 * @param {string} extension - File extension (default: 'csv')
 * @returns {string} Timestamped filename
 */
export function generateResultFilename(prefix = 'import-results', extension = 'csv') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Export complete import report (results + errors + breakdown)
 * 
 * @param {Object} result - Import result object
 * @param {Array} errors - Array of error objects
 * @param {Object} categoryBreakdown - Category breakdown object
 * @returns {string} Complete CSV report
 */
export function exportCompleteReport(result, errors, categoryBreakdown = null) {
  let report = 'IMPORT RESULTS SUMMARY\n';
  report += exportResultsToCSV(result);
  
  if (errors && errors.length > 0) {
    report += '\n\nIMPORT ERRORS\n';
    report += exportErrorsToCSV(errors);
  }
  
  if (categoryBreakdown && Object.keys(categoryBreakdown).length > 0) {
    report += '\n\nCATEGORY BREAKDOWN\n';
    report += exportCategoryBreakdownToCSV(categoryBreakdown);
  }
  
  return report;
}

/**
 * Download complete import report
 * 
 * @param {Object} result - Import result object
 * @param {Array} errors - Array of error objects
 * @param {Object} categoryBreakdown - Category breakdown object
 * @param {string} filename - Optional filename
 */
export function downloadCompleteReport(result, errors, categoryBreakdown = null, filename = null) {
  const csvContent = exportCompleteReport(result, errors, categoryBreakdown);
  const defaultFilename = generateResultFilename('import-complete-report');
  const download = createResultCSVDownload(csvContent, filename || defaultFilename);
  download.download();
}

/**
 * Format import result for display
 * 
 * @param {Object} result - Import result object
 * @returns {string} Formatted result text
 */
export function formatImportResult(result) {
  const {
    totalRecords = 0,
    successful = 0,
    skipped = 0,
    failed = 0,
    duration = 0
  } = result;

  const successRate = totalRecords > 0 ? ((successful / totalRecords) * 100).toFixed(1) : 0;
  const durationSeconds = (duration / 1000).toFixed(2);

  const lines = [
    `Import Summary:`,
    `  Total Records: ${totalRecords}`,
    `  Successful: ${successful}`,
    `  Skipped: ${skipped}`,
    `  Failed: ${failed}`,
    `  Success Rate: ${successRate}%`,
    `  Duration: ${durationSeconds}s`
  ];

  return lines.join('\n');
}

/**
 * Create import audit log entry
 * 
 * @param {Object} result - Import result object
 * @param {string} importType - Type of import (patient, inventory, lab)
 * @param {string} userId - User ID
 * @param {string} filename - Source filename
 * @returns {Object} Audit log entry
 */
export function createAuditLogEntry(result, importType, userId, filename) {
  return {
    timestamp: new Date().toISOString(),
    userId,
    importType,
    filename,
    totalRecords: result.totalRecords || 0,
    successful: result.successful || 0,
    skipped: result.skipped || 0,
    failed: result.failed || 0,
    duration: result.duration || 0,
    status: result.failed > 0 ? 'completed_with_errors' : 'completed',
    categoryBreakdown: result.categoryBreakdown || null
  };
}

/**
 * Export audit log entries to CSV
 * 
 * @param {Array} auditLogs - Array of audit log entries
 * @returns {string} CSV string
 */
export function exportAuditLogsToCSV(auditLogs) {
  if (!auditLogs || auditLogs.length === 0) {
    return 'No audit logs to export\n';
  }

  const logData = auditLogs.map(log => ({
    Timestamp: log.timestamp,
    'User ID': log.userId,
    'Import Type': log.importType,
    Filename: log.filename,
    'Total Records': log.totalRecords,
    Successful: log.successful,
    Skipped: log.skipped,
    Failed: log.failed,
    'Duration (s)': (log.duration / 1000).toFixed(2),
    Status: log.status
  }));

  return printCSV(logData);
}

/**
 * Calculate import statistics
 * 
 * @param {Object} result - Import result object
 * @returns {Object} Statistics
 */
export function calculateImportStatistics(result) {
  const {
    totalRecords = 0,
    successful = 0,
    skipped = 0,
    failed = 0,
    duration = 0
  } = result;

  const successRate = totalRecords > 0 ? (successful / totalRecords) * 100 : 0;
  const failureRate = totalRecords > 0 ? (failed / totalRecords) * 100 : 0;
  const skipRate = totalRecords > 0 ? (skipped / totalRecords) * 100 : 0;
  const recordsPerSecond = duration > 0 ? (totalRecords / duration) * 1000 : 0;

  return {
    successRate: successRate.toFixed(2),
    failureRate: failureRate.toFixed(2),
    skipRate: skipRate.toFixed(2),
    recordsPerSecond: recordsPerSecond.toFixed(2),
    averageTimePerRecord: totalRecords > 0 ? (duration / totalRecords).toFixed(2) : 0
  };
}
