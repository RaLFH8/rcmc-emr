import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

const DateRangeFilter = ({ startDate, endDate, onChange }) => {
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');
  const [error, setError] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  // Format date to YYYY-MM-DD for input
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Initialize local state from props
  useEffect(() => {
    setLocalStartDate(formatDateForInput(startDate));
    setLocalEndDate(formatDateForInput(endDate));
  }, [startDate, endDate]);

  // Validate and update date range
  const handleDateChange = (newStartDate, newEndDate) => {
    const start = new Date(newStartDate);
    const end = new Date(newEndDate);

    // Validation: end date must be >= start date
    if (end < start) {
      setError('End date cannot be before start date');
      return;
    }

    setError('');
    
    // Save to session storage
    sessionStorage.setItem('dashboardDateRange', JSON.stringify({
      startDate: newStartDate,
      endDate: newEndDate
    }));

    // Call parent onChange
    onChange(start, end);
  };

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setLocalStartDate(newStartDate);
    if (localEndDate) {
      handleDateChange(newStartDate, localEndDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setLocalEndDate(newEndDate);
    if (localStartDate) {
      handleDateChange(localStartDate, newEndDate);
    }
  };

  // Handle keyboard navigation for date inputs
  const handleKeyDown = (e, inputType) => {
    // Enter key confirms selection and moves to next input or triggers change
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputType === 'start' && localEndDate) {
        // Move focus to end date input
        document.querySelector('input[type="date"][aria-label="End date"]')?.focus();
      } else if (inputType === 'end' && localStartDate) {
        // Trigger change if both dates are set
        handleDateChange(localStartDate, localEndDate);
      }
    }
    
    // Tab key navigation is handled natively by browser
    // Arrow keys are handled natively by date picker
  };

  // Handle focus events for visual indicators
  const handleFocus = (inputType) => {
    setFocusedInput(inputType);
  };

  const handleBlur = () => {
    setFocusedInput(null);
  };

  // Preset date range functions
  const getPresetRange = (preset) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start, end;

    switch (preset) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = today;
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last3Months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = today;
        break;
      case 'last6Months':
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        end = today;
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = today;
        break;
      default:
        return;
    }

    const startStr = formatDateForInput(start);
    const endStr = formatDateForInput(end);
    
    setLocalStartDate(startStr);
    setLocalEndDate(endStr);
    handleDateChange(startStr, endStr);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Start Date Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <label htmlFor="start-date" className="text-sm font-medium text-slate-700">From:</label>
          <input
            id="start-date"
            type="date"
            value={localStartDate}
            onChange={handleStartDateChange}
            onKeyDown={(e) => handleKeyDown(e, 'start')}
            onFocus={() => handleFocus('start')}
            onBlur={handleBlur}
            aria-label="Start date"
            aria-describedby={error ? "date-range-error" : undefined}
            aria-invalid={error ? "true" : "false"}
            className={`px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              focusedInput === 'start' 
                ? 'border-teal-500 ring-2 ring-teal-500 ring-opacity-50' 
                : error 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-300 focus:ring-teal-500'
            }`}
          />
        </div>

        {/* End Date Picker */}
        <div className="flex items-center gap-2">
          <label htmlFor="end-date" className="text-sm font-medium text-slate-700">To:</label>
          <input
            id="end-date"
            type="date"
            value={localEndDate}
            onChange={handleEndDateChange}
            onKeyDown={(e) => handleKeyDown(e, 'end')}
            onFocus={() => handleFocus('end')}
            onBlur={handleBlur}
            aria-label="End date"
            aria-describedby={error ? "date-range-error" : undefined}
            aria-invalid={error ? "true" : "false"}
            className={`px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              focusedInput === 'end' 
                ? 'border-teal-500 ring-2 ring-teal-500 ring-opacity-50' 
                : error 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-300 focus:ring-teal-500'
            }`}
          />
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Date range presets">
        <button
          onClick={() => getPresetRange('thisMonth')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          aria-label="Select this month date range"
        >
          This Month
        </button>
        <button
          onClick={() => getPresetRange('lastMonth')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          aria-label="Select last month date range"
        >
          Last Month
        </button>
        <button
          onClick={() => getPresetRange('last3Months')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          aria-label="Select last 3 months date range"
        >
          Last 3 Months
        </button>
        <button
          onClick={() => getPresetRange('last6Months')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          aria-label="Select last 6 months date range"
        >
          Last 6 Months
        </button>
        <button
          onClick={() => getPresetRange('thisYear')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
          aria-label="Select this year date range"
        >
          This Year
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          id="date-range-error"
          role="alert"
          aria-live="polite"
          className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
