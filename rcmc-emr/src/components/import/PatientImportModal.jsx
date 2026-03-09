/**
 * Patient Import Modal Component
 * 
 * 3-Step wizard for importing patient consultation records from CSV:
 * Step 1: Upload CSV file
 * Step 2: Preview & Validate data
 * Step 3: Import Progress & Results
 * 
 * Requirements: 2.1-2.12, 10.1-10.10, 12.7
 */

import React, { useState, useEffect } from 'react';
import { parseCSV } from '../../utils/import/csvParser';
import { validatePatientData, batchImportPatients } from '../../services/import/patientImportService';
import { detectDuplicates } from '../../utils/import/duplicateDetector';
import { exportErrorsToCSV, downloadErrorsCSV } from '../../utils/import/validationErrorExport';
import { exportResultsToCSV, exportErrorsToCSV as exportErrors, downloadResultsCSV, downloadErrorsCSV as downloadErrors } from '../../utils/import/resultExporter';
import { ImportProgressTracker, ImportResultsSummary, LoadingSpinner } from './ProgressTracker';
import { validateFile } from '../../utils/import/inputSanitizer';
import { formatValidationError, formatDatabaseError, formatNetworkError, groupErrorsWithGuidance } from '../../utils/import/errorMessageFormatter';
import { createRetryHandler, analyzeError } from '../../utils/import/retryHandler';
import { db } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

/**
 * Patient Import Modal
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onSuccess - Success callback (refresh patient list)
 */
export function PatientImportModal({ isOpen, onClose, onSuccess }) {
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [retryHandler] = useState(() => createRetryHandler());
  const [showRetry, setShowRetry] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Load doctors on mount
  useEffect(() => {
    if (isOpen) {
      loadDoctors();
    }
  }, [isOpen]);

  async function loadDoctors() {
    try {
      const doctorsList = await db.getDoctors();
      setDoctors(doctorsList);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setError('Failed to load doctors list');
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  function resetState() {
    setCurrentStep(1);
    setFile(null);
    setParsedData(null);
    setValidationErrors([]);
    setDuplicates([]);
    setIsLoading(false);
    setProgress(null);
    setResult(null);
    setError(null);
    setShowRetry(false);
    setRetryAttempt(0);
    retryHandler.reset();
  }

  async function handleFileSelect(event) {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validate file using sanitizer utility (Requirements: 20.6, 20.7)
    const fileValidation = validateFile(selectedFile, {
      allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      allowedExtensions: ['csv', 'xls', 'xlsx'],
      maxSizeBytes: 5 * 1024 * 1024 // 5MB limit
    });

    if (!fileValidation.isValid) {
      setError(fileValidation.error);
      return;
    }

    setFile(selectedFile);
    setError(null);
    await parseFile(selectedFile);
  }

  async function parseFile(file) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await parseCSV(file);
      
      if (result.errors && result.errors.length > 0) {
        setError(`CSV parsing failed: ${result.errors[0].message}`);
        setIsLoading(false);
        return;
      }

      setParsedData(result);
      setIsLoading(false);
    } catch (err) {
      setError(`Failed to parse CSV: ${err.message}`);
      setIsLoading(false);
    }
  }

  async function handleNext() {
    if (currentStep === 1) {
      // Move to preview step
      await validateAndCheckDuplicates();
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Start import
      await startImport();
      setCurrentStep(3);
    }
  }

  async function validateAndCheckDuplicates() {
    setIsLoading(true);

    try {
      // Validate data
      const errors = validatePatientData(parsedData.data, doctors);
      setValidationErrors(errors);

      // Check for duplicates
      const duplicateResults = await detectDuplicates(
        parsedData.data,
        'patients',
        ['first_name', 'last_name', 'date_of_birth']
      );
      setDuplicates(duplicateResults.duplicates);

      setIsLoading(false);
    } catch (err) {
      setError(`Validation failed: ${err.message}`);
      setIsLoading(false);
    }
  }

  async function startImport() {
    setIsLoading(true);
    setShowRetry(false);
    setProgress({ percentage: 0, status: 'Starting import...', processedRecords: 0, totalRecords: parsedData.data.length });

    try {
      // Wrap import in retry handler
      await retryHandler.execute(async () => {
        // Filter out rows with validation errors
        const validRows = parsedData.data.filter((row, index) => {
          return !validationErrors.some(err => err.row === index + 1);
        });

        // Filter out duplicates marked as "skip"
        const rowsToImport = validRows.filter((row, index) => {
          const duplicate = duplicates.find(d => d.importRow === row);
          return !duplicate || duplicate.resolution !== 'skip';
        });

        // Import patients
        const importResult = await batchImportPatients(rowsToImport, doctors, (progressUpdate) => {
          setProgress({
            percentage: progressUpdate.percentage,
            status: progressUpdate.status,
            processedRecords: progressUpdate.current,
            totalRecords: progressUpdate.total,
            currentBatch: Math.ceil(progressUpdate.current / 50),
            totalBatches: Math.ceil(progressUpdate.total / 50)
          });
        }, userProfile, file?.name || 'unknown.csv');

        setResult({
          totalRecords: parsedData.data.length,
          successful: importResult.successful,
          skipped: duplicates.filter(d => d.resolution === 'skip').length,
          failed: importResult.failed,
          errors: importResult.errors,
          timestamp: new Date().toISOString(),
          userId: userProfile?.id || 'unknown'
        });

        setIsLoading(false);

        // Call success callback to refresh patient list
        if (onSuccess) {
          onSuccess();
        }
      }, (retryInfo) => {
        // Update progress with retry information
        setRetryAttempt(retryInfo.attempt);
        setProgress({
          percentage: 0,
          status: `Retry attempt ${retryInfo.attempt} of ${retryInfo.maxAttempts}. Waiting ${Math.round(retryInfo.delay / 1000)}s...`,
          processedRecords: 0,
          totalRecords: parsedData.data.length
        });
      });
    } catch (err) {
      // Analyze error to determine if retry should be shown
      const errorAnalysis = analyzeError(err);
      
      // Format error message based on type
      let errorMessage;
      if (errorAnalysis.isNetworkError) {
        errorMessage = formatNetworkError(err);
      } else if (errorAnalysis.isDatabaseError) {
        errorMessage = formatDatabaseError(err);
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setShowRetry(errorAnalysis.shouldShowRetry && retryAttempt < 5);
      setIsLoading(false);
    }
  }

  async function handleRetry() {
    setRetryAttempt(retryAttempt + 1);
    await startImport();
  }

  function handleBack() {
    if (currentStep > 1 && currentStep < 3) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleDownloadValidationErrors() {
    // Use enhanced error export with user-friendly messages and guidance
    const errors = validationErrors.map(error => ({
      ...error,
      message: formatValidationError(error)
    }));
    downloadErrorsCSV(errors, `patient-import-errors-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handleDownloadResults() {
    exportResults(result, 'patient-import-results.csv');
  }

  function handleDownloadErrors() {
    if (result && result.errors) {
      exportErrors(result.errors, 'patient-import-failed-records.csv');
    }
  }

  function handleClose() {
    if (currentStep === 3 && result) {
      // Import completed, close and refresh
      onClose();
    } else {
      // Ask for confirmation if import in progress
      if (currentStep === 3 && isLoading) {
        if (window.confirm('Import is in progress. Are you sure you want to close?')) {
          onClose();
        }
      } else {
        onClose();
      }
    }
  }

  const canProgress = currentStep === 1 ? (parsedData && !isLoading) : (validationErrors.length === 0);
  const canGoBack = currentStep === 2;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Import Patient Records</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicators */}
          <div className="mt-4 flex items-center justify-between">
            <StepIndicator number={1} label="Upload" active={currentStep === 1} completed={currentStep > 1} />
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div className={`h-full transition-all duration-300 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
            <StepIndicator number={2} label="Preview & Validate" active={currentStep === 2} completed={currentStep > 2} />
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div className={`h-full transition-all duration-300 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
            <StepIndicator number={3} label="Import & Results" active={currentStep === 3} completed={false} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}

          {currentStep === 1 && (
            <Step1Upload
              file={file}
              parsedData={parsedData}
              isLoading={isLoading}
              onFileSelect={handleFileSelect}
            />
          )}

          {currentStep === 2 && (
            <Step2Preview
              parsedData={parsedData}
              validationErrors={validationErrors}
              duplicates={duplicates}
              isLoading={isLoading}
              onDownloadErrors={handleDownloadValidationErrors}
            />
          )}

          {currentStep === 3 && (
            <Step3ImportResults
              progress={progress}
              result={result}
              isLoading={isLoading}
              error={error}
              showRetry={showRetry}
              retryAttempt={retryAttempt}
              onRetry={handleRetry}
              onDownloadResults={handleDownloadResults}
              onDownloadErrors={handleDownloadErrors}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={!canGoBack || isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              canGoBack && !isLoading
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            ← Back
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              {currentStep === 3 && result ? 'Close' : 'Cancel'}
            </button>

            {currentStep < 3 && (
              <button
                onClick={handleNext}
                disabled={!canProgress || isLoading}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  canProgress && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentStep === 1 ? 'Next →' : 'Start Import'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Step Indicator Component
 */
function StepIndicator({ number, label, active, completed }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
          completed
            ? 'bg-blue-600 text-white'
            : active
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {completed ? '✓' : number}
      </div>
      <span className={`mt-2 text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
  );
}

/**
 * Step 1: Upload Component
 */
function Step1Upload({ file, parsedData, isLoading, onFileSelect }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload CSV File</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a CSV file exported from Google Sheets containing patient consultation records.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              {file ? file.name : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500">CSV or Excel files (max 5MB)</p>
          </label>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner message="Parsing CSV file..." />
        </div>
      )}

      {parsedData && !isLoading && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">File Preview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Rows:</span>
              <span className="font-medium">{parsedData.rowCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Columns:</span>
              <span className="font-medium">{parsedData.headers.join(', ')}</span>
            </div>
          </div>

          {/* Preview first 5 rows */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {parsedData.headers.map((header, index) => (
                    <th key={index} className="px-3 py-2 text-left font-medium text-gray-700">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedData.data.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {parsedData.headers.map((header, colIndex) => (
                      <td key={colIndex} className="px-3 py-2 text-gray-600">
                        {row[header] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.data.length > 5 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Showing 5 of {parsedData.data.length} rows
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Expected CSV Format</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p><strong>Required columns:</strong> Patient Name, Age/Sex, Doctor, Consultation Date</p>
          <p><strong>Optional columns:</strong> Discount, Payment</p>
          <p><strong>Age/Sex format:</strong> "25/M" or "30/F"</p>
          <p><strong>Date format:</strong> YYYY-MM-DD or MM/DD/YYYY</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 2: Preview & Validate Component
 */
function Step2Preview({ parsedData, validationErrors, duplicates, isLoading, onDownloadErrors }) {
  const hasErrors = validationErrors.length > 0;
  const hasDuplicates = duplicates.length > 0;
  
  // Group errors with guidance for better display
  const groupedErrors = hasErrors ? groupErrorsWithGuidance(validationErrors) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview & Validate</h3>
        <p className="text-sm text-gray-600">
          Review the data and resolve any validation errors before importing.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner message="Validating data..." />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Validation Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{parsedData.data.length}</p>
            </div>
            <div className={`border rounded-lg p-4 ${hasErrors ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <p className="text-xs text-gray-600 mb-1">Validation Errors</p>
              <p className={`text-2xl font-bold ${hasErrors ? 'text-red-600' : 'text-green-600'}`}>
                {validationErrors.length}
              </p>
            </div>
            <div className={`border rounded-lg p-4 ${hasDuplicates ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}>
              <p className="text-xs text-gray-600 mb-1">Duplicates Found</p>
              <p className={`text-2xl font-bold ${hasDuplicates ? 'text-yellow-600' : 'text-gray-900'}`}>
                {duplicates.length}
              </p>
            </div>
          </div>

          {/* Validation Errors with User-Friendly Messages */}
          {hasErrors && groupedErrors && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-red-900">
                  Validation Errors ({validationErrors.length})
                </h4>
                <button
                  onClick={onDownloadErrors}
                  className="text-xs text-red-700 hover:text-red-900 font-medium flex items-center gap-1"
                >
                  📥 Download Error Report with Fixes
                </button>
              </div>
              
              {/* Error Type Summary */}
              <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                {groupedErrors.missing.count > 0 && (
                  <div className="bg-white p-2 rounded">
                    <span className="font-semibold">Missing Fields:</span> {groupedErrors.missing.count}
                  </div>
                )}
                {groupedErrors.invalid_type.count > 0 && (
                  <div className="bg-white p-2 rounded">
                    <span className="font-semibold">Invalid Types:</span> {groupedErrors.invalid_type.count}
                  </div>
                )}
                {groupedErrors.out_of_range.count > 0 && (
                  <div className="bg-white p-2 rounded">
                    <span className="font-semibold">Out of Range:</span> {groupedErrors.out_of_range.count}
                  </div>
                )}
                {groupedErrors.invalid_format.count > 0 && (
                  <div className="bg-white p-2 rounded">
                    <span className="font-semibold">Invalid Formats:</span> {groupedErrors.invalid_format.count}
                  </div>
                )}
              </div>
              
              {/* Error Details with Guidance */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {validationErrors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-xs bg-white p-3 rounded border border-red-100">
                    <div className="font-semibold text-red-900 mb-1">
                      {formatValidationError(error)}
                    </div>
                    {error.value && (
                      <div className="text-red-600 mb-1">
                        Value: "{error.value}"
                      </div>
                    )}
                    <div className="text-gray-700 italic">
                      💡 {getActionableGuidance(error.type, error.field)}
                    </div>
                  </div>
                ))}
                {validationErrors.length > 10 && (
                  <div className="text-xs text-red-700 text-center bg-white p-2 rounded">
                    ... and {validationErrors.length - 10} more errors. Download the full report to see all errors and suggested fixes.
                  </div>
                )}
              </div>
              
              {/* General Guidance */}
              <div className="mt-3 text-xs text-red-800 bg-white p-2 rounded">
                <strong>Next Steps:</strong> Download the error report, fix the issues in your CSV file, and re-upload to continue.
              </div>
            </div>
          )}

          {/* Duplicates Warning */}
          {hasDuplicates && (
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">Duplicate Records Found</h4>
              <p className="text-xs text-yellow-800 mb-3">
                {duplicates.length} potential duplicate(s) detected. These will be skipped during import.
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {duplicates.slice(0, 5).map((dup, index) => (
                  <div key={index} className="text-xs text-yellow-800 bg-white p-2 rounded">
                    Duplicate: {dup.importRow.patient_name || dup.importRow['Patient Name']}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {!hasErrors && !hasDuplicates && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <h4 className="text-sm font-semibold text-green-900">All Clear!</h4>
                  <p className="text-xs text-green-800">
                    All {parsedData.data.length} records passed validation. Ready to import.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Step 3: Import Progress & Results Component
 */
function Step3ImportResults({ progress, result, isLoading, error, showRetry, retryAttempt, onRetry, onDownloadResults, onDownloadErrors }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Progress & Results</h3>
      </div>

      {isLoading && progress && (
        <ImportProgressTracker progress={progress} />
      )}
      
      {/* Error with Retry Button */}
      {error && showRetry && !isLoading && (
        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-orange-900 mb-2">Import Failed</h4>
              <p className="text-xs text-orange-800 mb-3">{error}</p>
              <button
                onClick={onRetry}
                disabled={retryAttempt >= 5}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  retryAttempt < 5
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {retryAttempt < 5 
                  ? `🔄 Retry Import ${retryAttempt > 0 ? `(${retryAttempt}/5)` : ''}`
                  : 'Maximum Retries Reached'
                }
              </button>
              {retryAttempt > 0 && retryAttempt < 5 && (
                <p className="text-xs text-orange-700 mt-2">
                  {5 - retryAttempt} attempt{5 - retryAttempt > 1 ? 's' : ''} remaining
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {result && !isLoading && (
        <ImportResultsSummary
          result={result}
          onDownloadResults={onDownloadResults}
          onDownloadErrors={onDownloadErrors}
        />
      )}
    </div>
  );
}

export default PatientImportModal;
