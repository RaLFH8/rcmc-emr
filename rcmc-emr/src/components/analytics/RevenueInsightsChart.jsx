/**
 * Revenue Insights Chart Component
 * 
 * Multi-view chart combining 6 different revenue/financial perspectives:
 * 1. Department Revenue
 * 2. Service Type Revenue
 * 3. Payment Method Distribution
 * 4. Doctor Performance
 * 5. Inventory Cost Analysis
 * 6. Patient Type Revenue (New vs Returning)
 * 
 * Replaces the ExpenseBreakdownChart with comprehensive revenue insights
 */

import { useState, useRef, useEffect } from 'react'
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
import { 
  TrendingUp, 
  TrendingDown, 
  MoreVertical, 
  Download, 
  Building2,
  Stethoscope,
  CreditCard,
  UserCheck,
  Package,
  Users
} from 'lucide-react'

// View configurations
const VIEWS = [
  { id: 'department', label: 'Department Revenue', icon: Building2 },
  { id: 'service', label: 'Service Types', icon: Stethoscope },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'doctor', label: 'Doctor Performance', icon: UserCheck },
  { id: 'inventory', label: 'Inventory Costs', icon: Package },
  { id: 'patient', label: 'Patient Types', icon: Users }
]

/**
 * Custom label component for bar charts
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
 * Custom tooltip component
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload
  
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-semibold text-slate-900 mb-1">
        {data.name || data.category}
      </p>
      <p className="text-sm text-slate-600">
        Amount: {formatCurrency(data.value || data.amount)}
      </p>
      {data.percentage !== undefined && (
        <p className="text-sm text-slate-600">
          Percentage: {data.percentage.toFixed(1)}%
        </p>
      )}
      {data.count !== undefined && (
        <p className="text-sm text-slate-600">
          Count: {data.count}
        </p>
      )}
    </div>
  )
}

/**
 * RevenueInsightsChart Component
 */
const RevenueInsightsChart = ({
  data = {},
  totalRevenue = 0,
  previousPeriodTotal = 0
}) => {
  const [activeView, setActiveView] = useState('department')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  // Get current view data
  const getCurrentViewData = () => {
    switch (activeView) {
      case 'department':
        return data.departmentRevenue || []
      case 'service':
        return data.serviceTypeRevenue || []
      case 'payment':
        return data.paymentMethodDistribution || []
      case 'doctor':
        return data.doctorPerformance || []
      case 'inventory':
        return data.inventoryCosts || []
      case 'patient':
        return data.patientTypeRevenue || []
      default:
        return []
    }
  }

  const viewData = getCurrentViewData()
  const sortedData = [...viewData].sort((a, b) => (b.value || b.amount) - (a.value || a.amount))

  // Calculate percentage change
  const percentageChange = calculatePercentageChange(totalRevenue, previousPeriodTotal)
  const isIncrease = typeof percentageChange === 'number' && percentageChange > 0
  const isSignificantChange = percentageChange === "Significant Change"

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

  // Export chart data to CSV
  const handleExport = () => {
    const viewLabel = VIEWS.find(v => v.id === activeView)?.label || 'Revenue Insights'
    const csvHeaders = ['Name', 'Amount', 'Percentage']
    const csvRows = sortedData.map(item => [
      item.name || item.category,
      (item.value || item.amount).toFixed(2),
      item.percentage ? item.percentage.toFixed(2) + '%' : 'N/A'
    ])
    
    csvRows.push(['Total', totalRevenue.toFixed(2), '100%'])
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${viewLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setIsMenuOpen(false)
  }

  // Get current view icon
  const CurrentViewIcon = VIEWS.find(v => v.id === activeView)?.icon || Building2

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CurrentViewIcon className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-semibold text-slate-900">Revenue Insights</h3>
          </div>
          
          {/* Three-dot menu */}
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              aria-label="Revenue insights chart options"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <MoreVertical className="w-5 h-5 text-slate-600" />
            </button>

            {isMenuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10"
                role="menu"
              >
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  role="menuitem"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {VIEWS.map((view) => {
            const Icon = view.icon
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === view.id
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            )
          })}
        </div>

        {/* Total Display */}
        <div className="flex items-center justify-between">
          <div className="text-right flex-1">
            <p className="text-sm text-slate-600">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Percentage Change */}
        <div className="flex items-center justify-end gap-2 mt-2">
          {isSignificantChange ? (
            <span className="text-sm font-medium text-amber-600">
              {percentageChange}
            </span>
          ) : (
            <>
              {isIncrease ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(Math.abs(percentageChange))} {isIncrease ? 'increase' : 'decrease'}
              </span>
            </>
          )}
          <span className="text-sm text-slate-600">from previous period</span>
        </div>
      </div>

      {/* Chart */}
      {sortedData.length > 0 ? (
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
              dataKey="name"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              width={150}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              cursor="pointer"
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#14b8a6'} />
              ))}
              <LabelList content={<CustomLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="py-12 text-center">
          <CurrentViewIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No data available</p>
          <p className="text-sm text-slate-500 mt-1">Data will appear here once available</p>
        </div>
      )}

      {/* Legend */}
      {sortedData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sortedData.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color || '#14b8a6' }}
                />
                <span className="text-sm text-slate-700 truncate">{item.name || item.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RevenueInsightsChart
