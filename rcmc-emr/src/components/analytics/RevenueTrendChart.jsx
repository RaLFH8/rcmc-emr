/**
 * Revenue Trend Chart Component
 * 
 * Displays monthly revenue trends using a line chart with smooth curve interpolation.
 * Features time granularity selection, zoom functionality, and formatted axis labels.
 * 
 * Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10, 3.11, 3.12, 12.1, 12.8, 12.9, 12.10, 12.11
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { MoreVertical, Download, Calendar } from 'lucide-react'
import { formatCurrency } from '../../utils/metricCalculations'

/**
 * Format Y-axis labels with ₱ and abbreviated numbers
 * Examples: ₱450K, ₱1.2M
 * 
 * @param {number} value - Revenue value
 * @returns {string} Formatted label
 */
const formatYAxisLabel = (value) => {
  if (value >= 1000000) {
    return `₱${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `₱${(value / 1000).toFixed(0)}K`
  }
  return `₱${value}`
}

/**
 * Format X-axis labels as "Month YYYY"
 * Example: "January 2025"
 * 
 * @param {string} period - Period string (YYYY-MM format)
 * @returns {string} Formatted label
 */
const formatXAxisLabel = (period) => {
  if (!period) return ''
  
  const [year, month] = period.split('-')
  const date = new Date(year, parseInt(month) - 1)
  
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Custom tooltip component with exact revenue values
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-slate-900 mb-1">
        {formatXAxisLabel(data.period)}
      </p>
      <p className="text-sm text-teal-600 font-medium">
        Revenue: {formatCurrency(data.revenue)}
      </p>
    </div>
  )
}

/**
 * Custom dot component to highlight the most recent data point
 */
const CustomDot = (props) => {
  const { cx, cy, payload, index, data } = props
  
  // Highlight the last data point
  const isLastPoint = index === data.length - 1
  
  if (isLastPoint) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#14b8a6"
        stroke="#fff"
        strokeWidth={2}
      />
    )
  }
  
  return null
}

/**
 * RevenueTrendChart Component
 * 
 * @param {Object} props
 * @param {Array} props.data - Revenue trend data [{period: 'YYYY-MM', revenue: number, date: Date}]
 * @param {string} props.timeGranularity - Time granularity ('monthly', 'quarterly', 'yearly')
 * @param {Function} props.onTimeGranularityChange - Callback when granularity changes
 * @param {Function} props.onDataPointClick - Optional callback when data point is clicked
 */
const RevenueTrendChart = ({
  data = [],
  timeGranularity = 'monthly',
  onTimeGranularityChange,
  onDataPointClick
}) => {
  const [zoomDomain, setZoomDomain] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  
  // Generate unique ID for aria-describedby (Requirement 14.2)
  const chartDescriptionId = React.useId()

  // Close menu when clicking outside (Requirement 3.7)
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

  // Handle keyboard navigation for menu (Requirement 3.7)
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsMenuOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsMenuOpen(!isMenuOpen)
    }
  }

  // Handle export functionality (Requirement 3.7)
  const handleExport = () => {
    // Create CSV data for revenue trend
    const csvData = [
      ['Period', 'Revenue', 'Granularity'],
      ...data.map(item => [
        formatXAxisLabel(item.period),
        item.revenue,
        timeGranularity
      ]),
      ['Total', data.reduce((sum, item) => sum + item.revenue, 0), '']
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `Revenue_Trend_${timeGranularity}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setIsMenuOpen(false)
  }

  // Handle granularity change from menu (Requirement 3.5, 3.7)
  const handleGranularityChange = (granularity) => {
    if (onTimeGranularityChange) {
      onTimeGranularityChange(granularity)
    }
    setIsMenuOpen(false)
  }

  // Handle data point click
  const handleClick = (data) => {
    if (onDataPointClick) {
      onDataPointClick(data)
    }
  }

  // Handle zoom reset
  const handleZoomReset = () => {
    setZoomDomain(null)
  }

  // Calculate domain for zoom
  const xAxisDomain = zoomDomain ? [zoomDomain.left, zoomDomain.right] : undefined
  
  // Generate ARIA label describing chart data (Requirement 14.2)
  const generateAriaLabel = () => {
    if (data.length === 0) {
      return `Revenue trend line chart showing no data for the selected period.`
    }
    
    const startPeriod = formatXAxisLabel(data[0].period)
    const endPeriod = formatXAxisLabel(data[data.length - 1].period)
    const currentRevenue = formatCurrency(data[data.length - 1]?.revenue || 0)
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
    
    return `Revenue trend line chart showing ${timeGranularity} revenue from ${startPeriod} to ${endPeriod}. Current period revenue is ${currentRevenue}. Total revenue across all periods is ${formatCurrency(totalRevenue)}.`
  }
  
  // Generate description for data points (Requirement 14.2)
  const generateChartDescription = () => {
    if (data.length === 0) {
      return 'No revenue data available for the selected date range.'
    }
    
    const dataPoints = data.map(item => 
      `${formatXAxisLabel(item.period)}: ${formatCurrency(item.revenue)}`
    ).join(', ')
    
    return `Revenue data points: ${dataPoints}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Header with title and controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Revenue Trends</h3>
          <p className="text-sm text-slate-600 mt-1">Monthly revenue over time</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Zoom Reset Button */}
          {zoomDomain && (
            <button
              onClick={handleZoomReset}
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
            >
              Reset Zoom
            </button>
          )}

          {/* Three-dot menu button (Requirement 3.7) */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onKeyDown={handleKeyDown}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
              aria-label="Options for Revenue Trend chart"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>
            
            {/* Dropdown menu */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10"
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
                
                <div className="border-t border-slate-200 my-1" />
                
                <div className="px-4 py-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>Granularity</span>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleGranularityChange('monthly')}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                        timeGranularity === 'monthly'
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      role="menuitemradio"
                      aria-checked={timeGranularity === 'monthly'}
                      tabIndex={0}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => handleGranularityChange('quarterly')}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                        timeGranularity === 'quarterly'
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      role="menuitemradio"
                      aria-checked={timeGranularity === 'quarterly'}
                      tabIndex={0}
                    >
                      Quarterly
                    </button>
                    <button
                      onClick={() => handleGranularityChange('yearly')}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
                        timeGranularity === 'yearly'
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      role="menuitemradio"
                      aria-checked={timeGranularity === 'yearly'}
                      tabIndex={0}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        role="img"
        aria-label={generateAriaLabel()}
        aria-describedby={chartDescriptionId}
        tabIndex={0}
        className="focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg"
      >
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={(e) => {
              if (e && e.activePayload) {
                handleClick(e.activePayload[0].payload)
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            <XAxis
              dataKey="period"
              tickFormatter={formatXAxisLabel}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              domain={xAxisDomain}
            />
            
            <YAxis
              tickFormatter={formatYAxisLabel}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
            />
            
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#14b8a6"
              strokeWidth={3}
              dot={(props) => <CustomDot {...props} data={data} />}
              activeDot={{ r: 8 }}
              name="Revenue"
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Hidden description for screen readers (Requirement 14.2) */}
        <div id={chartDescriptionId} className="sr-only">
          {generateChartDescription()}
        </div>
      </div>

      {/* Current Month Revenue Display */}
      {data.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Current Period Revenue</span>
            <span className="text-xl font-bold text-teal-600">
              {formatCurrency(data[data.length - 1]?.revenue || 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RevenueTrendChart
