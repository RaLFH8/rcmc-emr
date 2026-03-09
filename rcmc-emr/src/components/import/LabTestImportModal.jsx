/**
 * Lab Test Import Modal Component
 * 
 * 3-Step wizard for importing laboratory tests from CSV:
 * Step 1: Upload CSV file
 * Step 2: Preview & Validate data with 15-category classification
 * Step 3: Import Progress & Results
 * 
 * Requirements: 4.1, 9.6, 12.9
 */

import { useState, useEffect } from 'react';
import { parseCSV } from '../../utils/import/csvParser';
import { validateLabTestData, batchImportLabTests, previewLabTestCategorization } from '../../services/import/labTestImportService';
import { detectDuplicates } from '../../utils/import/duplicateDetector';
import { exportErrorsToCSV, downloadErrorsCSV } from '../../utils/import/validationErrorExport';
import { exportResultsToCSV, exportErrorsToCSV as exportErrors, downloadResultsCSV, downloadErrorsCSV as downloadErrors } from '../../utils/import/resultExporter';
import { ImportProgressTracker, ImportResultsSummary, LoadingSpinner } from './ProgressTracker';
import { validateFile } from '../../utils/import/inputSanitizer';
import { formatValidationError, formatDatabaseError, formatNetworkError, groupErrorsWithGuidance, getActionableGuidance } from '../../utils/import/errorMessageFormatter';
import { createRetryHandler, analyzeError } from '../../utils/import/retryHandler';
import { useAuth } from '../../context/AuthContext';

/**
 * Lab Test Import Modal
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close callback
 * @param {Function} props.onSuccess - Success callback (refresh services list)
 */
export function LabTestImportModal({ isOpen, onClose, onSuccess }) {
  const { userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [categorizationPreview, setCategorizationPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
    setCategorizationPreview(null);
    setIsLoading(false);
    setProgress(null);
    setResult(null);
    setError(null);
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
      const errors = validateLabTestData(parsedData.data);
      setValidationErrors(errors);

      // Preview categorization
      const preview = previewLabTestCategorization(parsedData.data);
      setCategorizationPreview(preview);

      // Check for duplicates
      const duplicateResults = await detectDuplicates(
        parsedData.data,
        'services',
        ['name']
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
    setProgress({ percentage: 0, status: 'Starting import...', processedRecords: 0, totalRecords: parsedData.data.length });

    try {
      // Filter out rows with validation errors
      const validRows = parsedData.data.filter((row, index) => {
        return !validationErrors.some(err => err.row === index + 1);
      });

      // Filter out duplicates marked as "skip"
      const rowsToImport = validRows.filter((row) => {
        const duplicate = duplicates.find(d => d.importRow === row);
        return !duplicate || duplicate.resolution !== 'skip';
      });

      // Import lab tests
      const importResult = await batchImportLabTests(rowsToImport, (progressUpdate) => {
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
        categoryBreakdown: importResult.categoryBreakdown,
        timestamp: new Date().toISOString(),
        userId: userProfile?.id || 'unknown'
      });

      setIsLoading(false);

      // Call success callback to refresh services list
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      setIsLoading(false);
    }
  }

  function handleBack() {
    if (currentStep > 1 && currentStep < 3) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleDownloadValidationErrors() {
    exportValidationErrors(validationErrors, 'lab-test-import-errors.csv');
  }

  function handleDownloadResults() {
    exportResults(result, 'lab-test-import-results.csv');
  }

  function handleDownloadErrors() {
    if (result && result.errors) {
      exportErrors(result.errors, 'lab-test-import-failed-records.csv');
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
            <h2 className="text-2xl font-bold text-gray-900">Import Laboratory Tests</h2>
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
              categorizationPreview={categorizationPreview}
              isLoading={isLoading}
              onDownloadErrors={handleDownloadValidationErrors}
            />
          )}

          {currentStep === 3 && (
            <Step3ImportResults
              progress={progress}
              result={result}
              isLoading={isLoading}
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
          Upload a CSV file containing laboratory tests with automatic 15-category classification.
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
            <div className="text-6xl mb-4">🧪</div>
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
          <p><strong>Required columns:</strong> Test Name, Price</p>
          <p><strong>Optional columns:</strong> Description, Turnaround Time, Category</p>
          <p><strong>15 Categories:</strong> Hematology, Clinical Chemistry, Serology, Microbiology, Urinalysis, Fecalysis, Immunology, Toxicology, Molecular Diagnostics, Histopathology, Cytology, Blood Banking, Coagulation Studies, Endocrinology, Special Tests</p>
          <p><strong>Special notations:</strong> Use "/" for alternative names, "(each)" for per-item pricing</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Step 2: Preview & Validate Component
 */
function Step2Preview({ parsedData, validationErrors, duplicates, categorizationPreview, isLoading, onDownloadErrors }) {
  const hasErrors = validationErrors.length > 0;
  const hasDuplicates = duplicates.length > 0;

  // Get top 5 categories for display
  const topCategories = categorizationPreview ? 
    Object.entries(categorizationPreview.breakdown)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview & Validate</h3>
        <p className="text-sm text-gray-600">
          Review the data, 15-category classification, and resolve any validation errors before importing.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner message="Validating data and categorizing tests..." />
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

          {/* Category Breakdown */}
          {categorizationPreview && topCategories.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">15-Category Classification Preview (Top 5)</h4>
              <div className="space-y-2">
                {topCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between bg-white rounded p-2">
                    <span className="text-xs font-medium text-gray-700">{category.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-blue-600">{count}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-800 mt-3">
                Tests are automatically categorized into 15 medical categories based on keywords.
              </p>
            </div>
          )}

          {/* Validation Errors */}
          {hasErrors && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-red-900">Validation Errors</h4>
                <button
                  onClick={onDownloadErrors}
                  className="text-xs text-red-700 hover:text-red-900 font-medium"
                >
                  📥 Download Error Report
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {validationErrors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-xs text-red-800 bg-white p-2 rounded">
                    <strong>Row {error.row}:</strong> {error.message}
                    {error.value && <span className="text-red-600"> (Value: "{error.value}")</span>}
                  </div>
                ))}
                {validationErrors.length > 10 && (
                  <p className="text-xs text-red-700 text-center">
                    ... and {validationErrors.length - 10} more errors
                  </p>
                )}
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
                    Duplicate: {dup.importRow.test_name || dup.importRow['Test Name'] || dup.importRow.name}
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
function Step3ImportResults({ progress, result, isLoading, onDownloadResults, onDownloadErrors }) {
  // Get top 5 categories for display
  const topCategories = result && result.categoryBreakdown ? 
    Object.entries(result.categoryBreakdown)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Progress & Results</h3>
      </div>

      {isLoading && progress && (
        <ImportProgressTracker progress={progress} />
      )}

      {result && !isLoading && (
        <>
          <ImportResultsSummary
            result={result}
            onDownloadResults={onDownloadResults}
            onDownloadErrors={onDownloadErrors}
          />
          
          {/* Category Breakdown in Results */}
          {topCategories.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Category Breakdown (Top 5)</h4>
              <div className="space-y-2">
                {topCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between bg-white rounded p-2">
                    <span className="text-xs font-medium text-gray-700">{category.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-blue-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LabTestImportModal;
