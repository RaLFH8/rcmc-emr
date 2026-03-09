/**
 * Progress Tracker Component
 * 
 * Displays real-time import progress with progress bar, status text, and statistics.
 * Shows results summary after import completion.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9
 */

import React from 'react';

/**
 * Progress Bar Component
 * 
 * @param {Object} props - Component props
 * @param {number} props.percentage - Progress percentage (0-100)
 * @param {string} props.status - Current status text
 * @param {string} props.color - Progress bar color (default: blue)
 */
export function ProgressBar({ percentage, status, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  const bgColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="w-full">
      {status && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{status}</span>
          <span className="text-sm font-medium text-gray-700">{percentage}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${bgColor} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Import Progress Tracker Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.progress - Progress information
 * @param {number} props.progress.percentage - Progress percentage
 * @param {number} props.progress.processedRecords - Records processed
 * @param {number} props.progress.totalRecords - Total records
 * @param {string} props.progress.status - Status text
 * @param {number} props.progress.currentBatch - Current batch number
 * @param {number} props.progress.totalBatches - Total batches
 */
export function ImportProgressTracker({ progress }) {
  if (!progress) return null;

  const {
    percentage = 0,
    processedRecords = 0,
    totalRecords = 0,
    status = 'Processing...',
    currentBatch = 0,
    totalBatches = 0
  } = progress;

  return (
    <div className="space-y-4">
      <ProgressBar percentage={percentage} status={status} />
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Records:</span>
          <span className="ml-2 font-medium">{processedRecords} / {totalRecords}</span>
        </div>
        <div>
          <span className="text-gray-600">Batches:</span>
          <span className="ml-2 font-medium">{currentBatch} / {totalBatches}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Import Results Summary Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.result - Import result
 * @param {number} props.result.totalRecords - Total records processed
 * @param {number} props.result.successful - Successfully imported
 * @param {number} props.result.skipped - Skipped duplicates
 * @param {number} props.result.failed - Failed records
 * @param {Object} props.result.categoryBreakdown - Category breakdown (optional)
 * @param {string} props.result.timestamp - Import timestamp
 * @param {string} props.result.userId - User ID
 * @param {Function} props.onDownloadResults - Download results callback
 * @param {Function} props.onDownloadErrors - Download errors callback
 */
export function ImportResultsSummary({ result, onDownloadResults, onDownloadErrors }) {
  if (!result) return null;

  const {
    totalRecords = 0,
    successful = 0,
    skipped = 0,
    failed = 0,
    categoryBreakdown = null,
    timestamp = new Date().toISOString(),
    userId = 'Unknown'
  } = result;

  const successRate = totalRecords > 0 ? ((successful / totalRecords) * 100).toFixed(1) : 0;
  const hasErrors = failed > 0;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className={`p-4 rounded-lg ${hasErrors ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
        <div className="flex items-center">
          <span className="text-2xl mr-3">{hasErrors ? '⚠️' : '✅'}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {hasErrors ? 'Import Completed with Errors' : 'Import Completed Successfully'}
            </h3>
            <p className="text-sm text-gray-600">
              {successful} of {totalRecords} records imported ({successRate}% success rate)
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Records"
          value={totalRecords}
          icon="📊"
          color="gray"
        />
        <StatCard
          label="Successful"
          value={successful}
          icon="✅"
          color="green"
        />
        {skipped > 0 && (
          <StatCard
            label="Skipped"
            value={skipped}
            icon="⏭️"
            color="blue"
          />
        )}
        {failed > 0 && (
          <StatCard
            label="Failed"
            value={failed}
            icon="❌"
            color="red"
          />
        )}
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Category Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(categoryBreakdown).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">{category}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="border-t border-gray-200 pt-4 text-xs text-gray-500 space-y-1">
        <div>Import Time: {new Date(timestamp).toLocaleString()}</div>
        <div>User ID: {userId}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {onDownloadResults && (
          <button
            onClick={onDownloadResults}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            📥 Download Results
          </button>
        )}
        {hasErrors && onDownloadErrors && (
          <button
            onClick={onDownloadErrors}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            📥 Download Errors
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Stat label
 * @param {number} props.value - Stat value
 * @param {string} props.icon - Icon emoji
 * @param {string} props.color - Color theme
 */
function StatCard({ label, value, icon, color = 'gray' }) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200'
  };

  const bgClass = colorClasses[color] || colorClasses.gray;

  return (
    <div className={`border rounded-lg p-4 ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

/**
 * Estimated Time Remaining Component
 * 
 * @param {Object} props - Component props
 * @param {number} props.processedRecords - Records processed
 * @param {number} props.totalRecords - Total records
 * @param {number} props.startTime - Start timestamp
 */
export function EstimatedTimeRemaining({ processedRecords, totalRecords, startTime }) {
  if (processedRecords === 0 || !startTime) {
    return <span className="text-sm text-gray-500">Calculating...</span>;
  }

  const elapsed = Date.now() - startTime;
  const rate = processedRecords / elapsed; // records per ms
  const remaining = totalRecords - processedRecords;
  const estimatedMs = remaining / rate;

  const seconds = Math.ceil(estimatedMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  let timeText = '';
  if (minutes > 0) {
    timeText = `${minutes}m ${remainingSeconds}s`;
  } else {
    timeText = `${seconds}s`;
  }

  return (
    <span className="text-sm text-gray-500">
      Estimated time remaining: {timeText}
    </span>
  );
}

/**
 * Import Status Badge Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Import status
 */
export function ImportStatusBadge({ status }) {
  const statusConfig = {
    pending: { label: 'Pending', color: 'gray', icon: '⏳' },
    processing: { label: 'Processing', color: 'blue', icon: '⚙️' },
    completed: { label: 'Completed', color: 'green', icon: '✅' },
    failed: { label: 'Failed', color: 'red', icon: '❌' },
    cancelled: { label: 'Cancelled', color: 'yellow', icon: '⚠️' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClasses[config.color]}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}

/**
 * Compact Progress Indicator (for small spaces)
 * 
 * @param {Object} props - Component props
 * @param {number} props.percentage - Progress percentage
 * @param {string} props.size - Size variant (sm, md, lg)
 */
export function CompactProgressIndicator({ percentage, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-xs',
    md: 'w-20 h-20 text-sm',
    lg: 'w-24 h-24 text-base'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative ${sizeClass}`}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="50%"
          cy="50%"
          r="40%"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="50%"
          cy="50%"
          r="40%"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 40}`}
          strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
          className="text-blue-600 transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-semibold text-gray-700">{percentage}%</span>
      </div>
    </div>
  );
}

/**
 * Loading Spinner Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size variant (sm, md, lg)
 * @param {string} props.message - Loading message
 */
export function LoadingSpinner({ size = 'md', message = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={`${spinnerSize} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}

export default ImportProgressTracker;
