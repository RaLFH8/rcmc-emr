import React, { useState, useRef, useEffect } from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { MoreVertical, Download, Filter } from 'lucide-react'

/**
 * Patient Distribution Chart Component
 * 
 * Displays a donut chart showing patient distribution across departments.
 * Features center label with total count, legend with percentages, hover tooltips,
 * click interaction for drill-down filtering, and three-dot menu for export/drill-down options.
 * 
 * Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 12.1, 12.3, 14.2
 * 
 * @param {Object} props - Component props
 * @param {Array<DepartmentData>} props.data - Department distribution data
 * @param {number} props.totalPatients - Total patient count
 * @param {Function} [props.onSegmentClick] - Optional callback when segment is clicked
 */
const PatientDistributionChart = ({ data, totalPatients, onSegmentClick }) => {
  // State for dropdown menu (Requirement 2.6)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  // Sort departments by patient count descending (Requirement 2.10)
  const sortedData = [...data].sort((a, b) => b.count - a.count)
  
  // Generate unique ID for aria-describedby (Requirement 14.2)
  const legendId = React.useId()
  
  // Close menu when clicking outside (Requirement 2.6)
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

  // Handle keyboard navigation for menu (Requirement 2.6)
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsMenuOpen(false)
      buttonRef.current?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsMenuOpen(!isMenuOpen)
    }
  }

  // Handle export functionality (Requirement 2.6)
  const handleExport = () => {
    // Create CSV data for patient distribution
    const csvData = [
      ['Department', 'Patient Count', 'Percentage'],
      ...sortedData.map(dept => [
        dept.department,
        dept.count,
        `${dept.percentage}%`
      ]),
      ['Total', totalPatients, '100%']
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `Patient_Distribution_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setIsMenuOpen(false)
  }

  // Handle drill-down action (Requirement 2.6)
  const handleDrillDown = () => {
    // Show drill-down options or navigate to detailed view
    alert('Drill-down options:\n\n' + 
      sortedData.map(d => `• ${d.department}: ${d.count} patients (${d.percentage}%)`).join('\n') +
      '\n\nClick on a chart segment to filter by that department.')
    setIsMenuOpen(false)
  }
  
  // Generate ARIA label describing chart data (Requirement 14.2)
  const generateAriaLabel = () => {
    const topDepartments = sortedData.slice(0, 3).map(d => 
      `${d.department} with ${d.count} patients (${d.percentage}%)`
    ).join(', ')
    
    return `Patient distribution donut chart showing ${totalPatients} total patients across ${sortedData.length} departments. Top departments: ${topDepartments}.`
  }
  
  // Custom label component for center of donut (Requirement 2.6)
  const renderCenterLabel = () => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-900"
      >
        <tspan x="50%" dy="-0.5em" fontSize="32" fontWeight="bold">
          {totalPatients.toLocaleString('en-PH')}
        </tspan>
        <tspan x="50%" dy="1.5em" fontSize="14" className="fill-slate-600">
          Total Patients
        </tspan>
      </text>
    )
  }
  
  // Custom tooltip with detailed information (Requirement 2.8)
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-1">{data.department}</p>
          <p className="text-sm text-slate-600">
            Patients: <span className="font-medium text-slate-900">{data.count.toLocaleString('en-PH')}</span>
          </p>
          <p className="text-sm text-slate-600">
            Percentage: <span className="font-medium text-slate-900">{data.percentage}%</span>
          </p>
        </div>
      )
    }
    return null
  }
  
  // Custom legend with department names, percentages, and color indicators (Requirement 2.7)
  const renderLegend = (props) => {
    const { payload } = props
    
    return (
      <div 
        id={legendId}
        className="flex flex-col gap-2 mt-4"
        role="list"
        aria-label="Department distribution legend"
      >
        {payload.map((entry, index) => (
          <div
            key={`legend-${index}`}
            className="flex items-center justify-between gap-3 text-sm"
            role="listitem"
          >
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-slate-700 truncate">{entry.value}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-slate-900 font-medium">
                {entry.payload.count.toLocaleString('en-PH')}
              </span>
              <span className="text-slate-600 w-12 text-right">
                {entry.payload.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Handle segment click for drill-down filtering (Requirement 12.3)
  const handleClick = (data) => {
    if (onSegmentClick) {
      onSegmentClick(data.department)
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Header with title and three-dot menu */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Patient Distribution by Department
        </h3>
        
        {/* Three-dot menu button (Requirement 2.6) */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            onKeyDown={handleKeyDown}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
            aria-label="Options for Patient Distribution chart"
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
                onClick={handleDrillDown}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-slate-100"
                role="menuitem"
                tabIndex={0}
              >
                <Filter className="w-4 h-4" />
                <span>Drill Down</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div
        role="img"
        aria-label={generateAriaLabel()}
        aria-describedby={legendId}
        tabIndex={0}
        className="focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 rounded-lg relative"
      >
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            {/* Donut chart with innerRadius for donut effect (Requirement 2.1) */}
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="count"
              nameKey="department"
              onClick={handleClick}
              style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
            >
              {/* Use distinct colors for each department (Requirement 2.5) */}
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity duration-200"
                />
              ))}
            </Pie>
            
            {/* Hover tooltips with detailed information (Requirement 2.8) */}
            <Tooltip content={<CustomTooltip />} />
            
            {/* Legend with department names, percentages, and color indicators (Requirement 2.7) */}
            <Legend 
              content={renderLegend}
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label with total patient count (Requirement 2.6) */}
        <svg
          className="absolute top-0 left-0 w-full pointer-events-none"
          style={{ height: '400px' }}
          aria-hidden="true"
        >
          {renderCenterLabel()}
        </svg>
      </div>
    </div>
  )
}

export default PatientDistributionChart
