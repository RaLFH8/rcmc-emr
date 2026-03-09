import React, { useState, useRef, useEffect } from 'react'
import { ArrowUp, ArrowDown, MoreVertical, Download, Info } from 'lucide-react'
import { 
  formatCurrency, 
  formatPercentage, 
  formatSatisfactionScore,
  calculatePercentageChange 
} from '../../utils/metricCalculations'

/**
 * KPI Card Component
 * 
 * Displays a key performance indicator with value, trend, and description.
 * Supports multiple format types: number, currency, percentage, rating.
 * 
 * Requirements: 1.1, 1.6, 1.8, 1.9, 1.10-1.12, 9.2-9.4
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {number|string} props.value - Current value to display
 * @param {number} props.previousValue - Previous period value for trend calculation
 * @param {'number'|'currency'|'percentage'|'rating'} props.format - Value format type
 * @param {React.Component} props.icon - Lucide icon component
 * @param {string} props.iconColor - Icon background color (Tailwind class)
 * @param {'up'|'down'|'neutral'} [props.trend] - Trend direction (optional, auto-calculated if not provided)
 * @param {number|string} [props.trendPercentage] - Trend percentage (optional, auto-calculated if not provided)
 * @param {string} [props.description] - Additional description text (optional)
 */
const KPICard = ({
  title,
  value,
  previousValue,
  format,
  icon: Icon,
  iconColor,
  trend,
  trendPercentage,
  description
}) => {
  // State for dropdown menu
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  // Auto-calculate trend and percentage if not provided
  const calculatedPercentage = trendPercentage ?? calculatePercentageChange(value, previousValue)
  
  // Determine trend direction if not explicitly provided
  let trendDirection = trend
  if (!trendDirection) {
    if (calculatedPercentage === "Significant Change" || calculatedPercentage === 0) {
      trendDirection = 'neutral'
    } else if (calculatedPercentage > 0) {
      trendDirection = 'up'
    } else {
      trendDirection = 'down'
    }
  }
  
  // Format the display value based on format prop
  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val)
      case 'percentage':
        return formatPercentage(val)
      case 'rating':
        return formatSatisfactionScore(val)
      case 'number':
      default:
        return val?.toLocaleString('en-PH') ?? '0'
    }
  }
  
  // Format the trend percentage for display
  const formattedTrendPercentage = typeof calculatedPercentage === 'string' 
    ? calculatedPercentage 
    : formatPercentage(Math.abs(calculatedPercentage))
  
  // Determine trend color classes (Requirement 1.8, 1.9)
  const trendColorClass = trendDirection === 'up' 
    ? 'text-green-600' 
    : trendDirection === 'down' 
    ? 'text-red-600' 
    : 'text-slate-500'
  
  const TrendIcon = trendDirection === 'up' 
    ? ArrowUp 
    : trendDirection === 'down' 
    ? ArrowDown 
    : null

  // Create descriptive ARIA label for screen readers (Requirement 14.1)
  const ariaLabel = `${title}: ${formatValue(value)}${
    trendDirection !== 'neutral' 
      ? `, ${trendDirection === 'up' ? 'increased' : 'decreased'} by ${formattedTrendPercentage}` 
      : ', no change'
  }${description ? `, ${description}` : ''}`

  // Close menu when clicking outside (Requirement 1.8)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Handle keyboard navigation (Requirement 1.8)
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsMenuOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsMenuOpen(!isMenuOpen)
    }
  }

  // Handle menu item actions
  const handleExport = () => {
    // Create CSV data for this KPI
    const csvData = [
      ['Metric', 'Current Value', 'Previous Value', 'Change', 'Change %'],
      [
        title,
        formatValue(value),
        formatValue(previousValue),
        value - previousValue,
        formattedTrendPercentage
      ]
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setIsMenuOpen(false)
  }

  const handleViewDetails = () => {
    // This would typically open a modal or navigate to a detailed view
    // For now, we'll just log the action
    console.log(`View details for ${title}`)
    alert(`Detailed view for ${title} would open here.\n\nCurrent: ${formatValue(value)}\nPrevious: ${formatValue(previousValue)}\nChange: ${formattedTrendPercentage}`)
    setIsMenuOpen(false)
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200"
      role="region"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {/* Header with icon, title, and three-dot menu */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-600 mb-1">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`p-3 rounded-lg ${iconColor}`} aria-hidden="true">
            <Icon className="w-5 h-5 text-white" />
          </div>
          
          {/* Three-dot menu button (Requirement 1.8) */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onKeyDown={handleKeyDown}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
              aria-label={`Options for ${title}`}
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>
            
            {/* Dropdown menu */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10"
                role="menu"
                aria-orientation="vertical"
              >
                <button
                  onClick={handleExport}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-slate-100"
                  role="menuitem"
                  tabIndex={0}
                >
                  <Download className="w-4 h-4" />
                  <span>Export Data</span>
                </button>
                <button
                  onClick={handleViewDetails}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-slate-100"
                  role="menuitem"
                  tabIndex={0}
                >
                  <Info className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main value display */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-slate-900">
          {formatValue(value)}
        </p>
      </div>
      
      {/* Trend indicator with percentage change */}
      <div className="flex items-center gap-2">
        {TrendIcon && (
          <div className={`flex items-center gap-1 ${trendColorClass}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {formattedTrendPercentage}
            </span>
          </div>
        )}
        {!TrendIcon && calculatedPercentage === 0 && (
          <div className="flex items-center gap-1 text-slate-500">
            <span className="text-sm font-medium">No change</span>
          </div>
        )}
        {description && (
          <span className="text-sm text-slate-500">
            {description}
          </span>
        )}
      </div>
    </div>
  )
}

export default KPICard
