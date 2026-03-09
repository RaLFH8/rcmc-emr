/**
 * Performance Comparison Chart Component
 * 
 * Displays hospital performance metrics compared to baseline averages using a radar chart.
 * Shows five performance metrics with two overlaid polygons for comparison.
 * 
 * Requirements: 5.1, 5.2, 5.8, 5.9, 5.10, 5.11, 5.12, 12.1, 12.2
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { MoreVertical, Download } from 'lucide-react'

/**
 * Custom tooltip component with exact values
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-slate-900 mb-2">
        {payload[0].payload.metric}
      </p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 mb-1">
          <span className="text-sm" style={{ color: entry.color }}>
            {entry.name}:
          </span>
          <span className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.value.toFixed(1)}/5.0
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * PerformanceComparisonChart Component
 * 
 * @param {Object} props
 * @param {Object} props.hospitalData - Hospital performance metrics
 * @param {number} props.hospitalData.patientSatisfaction - Patient satisfaction score (0-5)
 * @param {number} props.hospitalData.recoveryRate - Recovery rate score (0-5)
 * @param {number} props.hospitalData.emergencyResponse - Emergency response score (0-5)
 * @param {number} props.hospitalData.followUpRate - Follow-up rate score (0-5)
 * @param {number} props.hospitalData.treatmentSuccess - Treatment success score (0-5)
 * @param {Object} props.baselineData - Baseline comparison metrics (same structure as hospitalData)
 * @param {Function} props.onMetricClick - Optional callback when metric is clicked
 */
const PerformanceComparisonChart = ({
  hospitalData = {},
  baselineData = {},
  onMetricClick
}) => {
  // State for menu visibility (Requirement 5.9)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  
  // Generate unique ID for aria-describedby (Requirement 14.2)
  const summaryId = React.useId()

  // Close menu when clicking outside (Requirement 5.9)
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

  // Handle keyboard navigation for menu (Requirement 5.9)
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsMenuOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsMenuOpen(!isMenuOpen)
    }
  }

  // Handle export functionality (Requirement 5.9)
  const handleExport = () => {
    // Create CSV data for performance comparison
    const csvData = [
      ['Metric', 'Your Hospital', 'Avg. Hospital', 'Difference'],
      ...chartData.map(item => [
        item.metric,
        item['Your Hospital'].toFixed(2),
        item['Avg. Hospital'].toFixed(2),
        (item['Your Hospital'] - item['Avg. Hospital']).toFixed(2)
      ])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `Performance_Comparison_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setIsMenuOpen(false)
  }

  // Transform data for radar chart
  // All metrics should already be scaled to 0-5 range (Requirement 5.10)
  const chartData = [
    {
      metric: 'Patient Satisfaction',
      'Your Hospital': hospitalData.patientSatisfaction || 0,
      'Avg. Hospital': baselineData.patientSatisfaction || 0,
      fullWidth: 5
    },
    {
      metric: 'Recovery Rate',
      'Your Hospital': hospitalData.recoveryRate || 0,
      'Avg. Hospital': baselineData.recoveryRate || 0,
      fullWidth: 5
    },
    {
      metric: 'Emergency Response',
      'Your Hospital': hospitalData.emergencyResponse || 0,
      'Avg. Hospital': baselineData.emergencyResponse || 0,
      fullWidth: 5
    },
    {
      metric: 'Follow-up Rate',
      'Your Hospital': hospitalData.followUpRate || 0,
      'Avg. Hospital': baselineData.followUpRate || 0,
      fullWidth: 5
    },
    {
      metric: 'Treatment Success',
      'Your Hospital': hospitalData.treatmentSuccess || 0,
      'Avg. Hospital': baselineData.treatmentSuccess || 0,
      fullWidth: 5
    }
  ]

  // Generate ARIA label describing chart data (Requirement 14.2)
  const generateAriaLabel = () => {
    const metrics = chartData.map(item => {
      const hospitalValue = item['Your Hospital'].toFixed(1)
      const baselineValue = item['Avg. Hospital'].toFixed(1)
      const difference = (item['Your Hospital'] - item['Avg. Hospital']).toFixed(1)
      const comparison = difference > 0 ? 'above' : difference < 0 ? 'below' : 'equal to'
      
      return `${item.metric}: ${hospitalValue} out of 5, ${comparison} average of ${baselineValue}`
    }).join(', ')
    
    return `Performance comparison radar chart showing 5 hospital metrics compared to industry averages. ${metrics}.`
  }

  // Generate description for performance metrics (Requirement 14.2)
  const generateChartDescription = () => {
    const metricDetails = chartData.map(item => {
      const hospitalValue = item['Your Hospital'].toFixed(1)
      const baselineValue = item['Avg. Hospital'].toFixed(1)
      const difference = (item['Your Hospital'] - item['Avg. Hospital']).toFixed(1)
      
      return `${item.metric}: Your Hospital ${hospitalValue}/5.0, Average Hospital ${baselineValue}/5.0, Difference ${difference > 0 ? '+' : ''}${difference}`
    }).join('. ')
    
    return metricDetails
  }

  // Handle metric click
  const handleClick = (data) => {
    if (onMetricClick && data) {
      onMetricClick(data.metric)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Performance Comparison</h3>
          <p className="text-sm text-slate-600 mt-1">
            Compare your hospital's performance against industry averages
          </p>
        </div>
        
        {/* Three-dot menu button (Requirement 5.9) */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            onKeyDown={handleKeyDown}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
            aria-label="Options for Performance Comparison chart"
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
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div
        role="img"
        aria-label={generateAriaLabel()}
        aria-describedby={summaryId}
        tabIndex={0}
        className="focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg"
      >
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart
            data={chartData}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
          >
            <PolarGrid stroke="#e2e8f0" />
            
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#475569', fontSize: 12 }}
              tickLine={false}
            />
            
            <PolarRadiusAxis
              angle={90}
              domain={[0, 5]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickCount={6}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Baseline polygon (gray) */}
            <Radar
              name="Avg. Hospital"
              dataKey="Avg. Hospital"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            
            {/* Hospital polygon (blue/teal) */}
            <Radar
              name="Your Hospital"
              dataKey="Your Hospital"
              stroke="#14b8a6"
              fill="#14b8a6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px'
              }}
              iconType="circle"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div 
        id={summaryId}
        className="mt-6 pt-6 border-t border-slate-200"
        role="list"
        aria-label="Performance metrics comparison summary"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartData.map((item, index) => {
            const hospitalValue = item['Your Hospital']
            const baselineValue = item['Avg. Hospital']
            const difference = hospitalValue - baselineValue
            const isAboveAverage = difference > 0
            
            return (
              <div 
                key={index} 
                className="flex items-center justify-between"
                role="listitem"
              >
                <span className="text-sm text-slate-700">{item.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {hospitalValue.toFixed(1)}/5.0
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      isAboveAverage
                        ? 'bg-green-100 text-green-700'
                        : difference === 0
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isAboveAverage ? '+' : ''}{difference.toFixed(1)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Hidden description for screen readers (Requirement 14.2) */}
        <div className="sr-only">
          {generateChartDescription()}
        </div>
      </div>
    </div>
  )
}

export default PerformanceComparisonChart
