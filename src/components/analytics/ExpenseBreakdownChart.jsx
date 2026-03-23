/**
 * Expense Breakdown Chart Component
 * 
 * Displays hospital expenses by category using a horizontal bar chart.
 * Shows five expense categories with distinct color coding and amount labels.
 * 
 * Requirements: 4.1, 4.2, 4.8, 4.9, 4.10, 4.11, 4.12, 4.13, 12.1, 12.5
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts'
import { formatCurrency, formatPercentage, calculatePercentageChange } from '../../utils/metricCalculations'
import { TrendingUp, TrendingDown, MoreVertical, Download, Calendar } from 'lucide-react'

/**
 * Custom label component to display amounts at bar ends
 */
const CustomLabel = (props) => {
  const { x, y, width, value } = props
  
  return (
    <text
      x={x + width + 10}
      y={y + 12}
      fill="#475569"
      fontSize={13}
      fontWeight={600}
    >
      {formatCurrency(value)}
    </text>
  )
}

/**
 * Custom tooltip component with detailed information
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-slate-900 mb-1">
        {data.category}
      </p>
      <p className="text-sm text-slate-600">
        Amount: {formatCurrency(data.amount)}
      </p>
      <p className="text-sm text-slate-600">
        Percentage: {data.percentage.toFixed(1)}%
      </p>
    </div>
  )
}

/**
 * ExpenseBreakdownChart Component
 * 
 * @param {Object} props
 * @param {Array} props.data - Expense data [{category: string, amount: number, color: string, percentage: number}]
 * @param {number} props.totalExpenses - Total expenses sum
 * @param {number} props.previousPeriodTotal - Previous period total for comparison
 * @param {Function} props.onCategoryClick - Optional callback when category is clicked
 * @param {string} props.selectedMonth - Currently selected month filter (e.g., "2024-01")
 * @param {Function} props.onMonthChange - Callback when month filter changes
 */
const ExpenseBreakdownChart = ({
  data = [],
  totalExpenses = 0,
  previousPeriodTotal = 0,
  onCategoryClick,
  selectedMonth = null,
  onMonthChange
}) => {
  // State for menu visibility
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  // Sort data by amount descending (Requirement 4.12)
  const sortedData = [...data].sort((a, b) => b.amount - a.amount)

  // Calculate percentage change from previous period
  const percentageChange = calculatePercentageChange(totalExpenses, previousPeriodTotal)
  const isIncrease = typeof percentageChange === 'number' && percentageChange > 0
  const isSignificantChange = percentageChange === "Significant Change"

  // Generate unique ID for aria-describedby (Requirement 14.2)
  const legendId = React.useId()

  // Close menu when clicking outside
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
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isMenuOpen])

  // Handle keyboard navigation for menu
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsMenuOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsMenuOpen(!isMenuOpen)
    }
  }

  // Export chart data to CSV
  const handleExport = () => {
    const csvHeaders = ['Category', 'Amount', 'Percentage']
    const csvRows = sortedData.map(item => [
      item.category,
      item.amount.toFixed(2),
      item.percentage.toFixed(2) + '%'
    ])
    
    // Add total row
    csvRows.push(['Total', totalExpenses.toFixed(2), '100%'])
    
    // Add month filter info if available
    if (selectedMonth) {
      csvRows.unshift(['Month Filter', selectedMonth, ''])
      csvRows.unshift(['', '', ''])
    }
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `Expense_Breakdown_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setIsMenuOpen(false)
  }

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = []
    const today = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }
    
    return options
  }

  const monthOptions = generateMonthOptions()

  // Generate ARIA label describing chart data (Requirement 14.2)
  const generateAriaLabel = () => {
    if (sortedData.length === 0) {
      return `Expense breakdown horizontal bar chart showing no expense data for the selected period.`
    }
    
    const topCategories = sortedData.slice(0, 3).map(d => 
      `${d.category} with ${formatCurrency(d.amount)} (${d.percentage.toFixed(1)}%)`
    ).join(', ')
    
    return `Expense breakdown horizontal bar chart showing ${formatCurrency(totalExpenses)} total expenses across ${sortedData.length} categories. Top categories: ${topCategories}.`
  }

  // Generate description for expense categories (Requirement 14.2)
  const generateChartDescription = () => {
    if (sortedData.length === 0) {
      return 'No expense data available for the selected date range.'
    }
    
    const categoryDetails = sortedData.map(item => 
      `${item.category}: ${formatCurrency(item.amount)} (${item.percentage.toFixed(1)}%)`
    ).join(', ')
    
    return `Expense categories: ${categoryDetails}`
  }

  // Handle bar click
  const handleClick = (data) => {
    if (onCategoryClick) {
      onCategoryClick(data.category)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Header with title and total expenses */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-900">Expense Breakdown</h3>
          
          {/* Three-dot menu button */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onKeyDown={handleKeyDown}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              aria-label="Expense breakdown chart options"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <MoreVertical className="w-5 h-5 text-slate-600" />
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10"
                role="menu"
                aria-orientation="vertical"
              >
                {/* Export option */}
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  role="menuitem"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>

                {/* Month filter section */}
                {onMonthChange && (
                  <>
                    <div className="border-t border-slate-200 my-1"></div>
                    <div className="px-4 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Filter by Month
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {/* All months option */}
                        <button
                          onClick={() => {
                            onMonthChange(null)
                            setIsMenuOpen(false)
                          }}
                          className={`w-full px-3 py-1.5 text-left text-sm rounded transition-colors ${
                            selectedMonth === null
                              ? 'bg-teal-50 text-teal-700 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          role="menuitemradio"
                          aria-checked={selectedMonth === null}
                        >
                          All Months
                        </button>
                        
                        {/* Individual month options */}
                        {monthOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              onMonthChange(option.value)
                              setIsMenuOpen(false)
                            }}
                            className={`w-full px-3 py-1.5 text-left text-sm rounded transition-colors ${
                              selectedMonth === option.value
                                ? 'bg-teal-50 text-teal-700 font-medium'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                            role="menuitemradio"
                            aria-checked={selectedMonth === option.value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Total Expenses Display */}
        <div className="flex items-center justify-between">
          <div className="text-right flex-1">
            <p className="text-sm text-slate-600">Total Expenses</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>

        {/* Percentage Change from Previous Period */}
        <div className="flex items-center justify-end gap-2 mt-2">
          {isSignificantChange ? (
            <span className="text-sm font-medium text-amber-600">
              {percentageChange}
            </span>
          ) : (
            <>
              {isIncrease ? (
                <TrendingUp className="w-4 h-4 text-red-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-600" />
              )}
              <span className={`text-sm font-medium ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                {formatPercentage(Math.abs(percentageChange))} {isIncrease ? 'increase' : 'decrease'}
              </span>
            </>
          )}
          <span className="text-sm text-slate-600">from previous period</span>
        </div>
      </div>

      {/* Chart */}
      <div
        role="img"
        aria-label={generateAriaLabel()}
        aria-describedby={legendId}
        tabIndex={0}
        className="focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg"
      >
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
            
            <XAxis
              type="number"
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `₱${(value / 1000000).toFixed(1)}M`
                } else if (value >= 1000) {
                  return `₱${(value / 1000).toFixed(0)}K`
                }
                return `₱${value}`
              }}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            
            <YAxis
              type="category"
              dataKey="category"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              width={180}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Bar
              dataKey="amount"
              radius={[0, 8, 8, 0]}
              onClick={handleClick}
              cursor="pointer"
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList content={<CustomLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div 
        id={legendId}
        className="mt-6 pt-6 border-t border-slate-200"
        role="list"
        aria-label="Expense category legend"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sortedData.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2"
              role="listitem"
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="text-sm text-slate-700">{item.category}</span>
            </div>
          ))}
        </div>
        
        {/* Hidden description for screen readers (Requirement 14.2) */}
        <div className="sr-only">
          {generateChartDescription()}
        </div>
      </div>
    </div>
  )
}

export default ExpenseBreakdownChart
