import React, { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'

/**
 * Doctor Revenue Table Component
 * 
 * Displays per-doctor revenue breakdown with consultation counts and revenue by category.
 * Shows doctor share (60%) and clinic share (40%) for each category.
 * Supports sorting and expandable rows for detailed category breakdown.
 * 
 * Validates: Requirements 1.1, 1.2, 1.4, 1.5, 2.3, 2.6, 3.3, 3.6
 * 
 * @param {Object} props - Component props
 * @param {Array} props.doctors - Array of doctor revenue data
 * @param {string} [props.sortBy] - Current sort column (default: 'consultationCount')
 * @param {string} [props.sortOrder] - Sort direction 'asc' or 'desc' (default: 'desc')
 * @param {Function} [props.onSort] - Sort handler callback
 */
const DoctorRevenueTable = ({
  doctors = [],
  sortBy = 'consultationCount',
  sortOrder = 'desc',
  onSort
}) => {
  // State for expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set())

  // Toggle row expansion
  const toggleRow = (doctorId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(doctorId)) {
      newExpanded.delete(doctorId)
    } else {
      newExpanded.add(doctorId)
    }
    setExpandedRows(newExpanded)
  }

  // Handle sort click
  const handleSort = (column) => {
    if (onSort) {
      onSort(column)
    }
  }

  // Format currency with ₱ symbol
  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Render sort icon
  const SortIcon = ({ column }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-teal-600" />
      : <ChevronDown className="w-4 h-4 text-teal-600" />
  }

  if (doctors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <p className="text-slate-500">No doctor revenue data available for the selected date range.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('doctorName')}
                  className="flex items-center gap-2 hover:text-teal-600 transition-colors"
                >
                  Doctor Name
                  <SortIcon column="doctorName" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Specialization
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('consultationCount')}
                  className="flex items-center gap-2 hover:text-teal-600 transition-colors mx-auto"
                >
                  Consultations
                  <SortIcon column="consultationCount" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('totalRevenue')}
                  className="flex items-center gap-2 hover:text-teal-600 transition-colors ml-auto"
                >
                  Total Revenue
                  <SortIcon column="totalRevenue" />
                </button>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Doctor Share (60%)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Clinic Share (40%)
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {doctors.map((doctor) => {
              const isExpanded = expandedRows.has(doctor.doctorId)
              
              return (
                <React.Fragment key={doctor.doctorId}>
                  {/* Main Row */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {doctor.doctorName}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {doctor.specialization}
                    </td>
                    <td className="px-4 py-4 text-sm text-center text-slate-900 font-medium">
                      {doctor.consultationCount}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-semibold text-slate-900">
                      {formatCurrency(doctor.totalRevenue)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-teal-600">
                      {formatCurrency(doctor.doctorShare)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-purple-600">
                      {formatCurrency(doctor.clinicShare)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleRow(doctor.doctorId)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Hide' : 'Show'} details for ${doctor.doctorName}`}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Show
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {isExpanded && (
                    <tr className="bg-slate-50">
                      <td colSpan="7" className="px-4 py-4">
                        <div className="ml-8">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">
                            Revenue Breakdown by Category
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Consultation Fees */}
                            <CategoryCard
                              title="Consultation Fees"
                              total={doctor.revenueByCategory.consultationFees.total}
                              doctorShare={doctor.revenueByCategory.consultationFees.doctorShare}
                              clinicShare={doctor.revenueByCategory.consultationFees.clinicShare}
                              color="blue"
                            />

                            {/* Procedures */}
                            <CategoryCard
                              title="Procedures"
                              total={doctor.revenueByCategory.procedures.total}
                              doctorShare={doctor.revenueByCategory.procedures.doctorShare}
                              clinicShare={doctor.revenueByCategory.procedures.clinicShare}
                              color="indigo"
                            />

                            {/* Services */}
                            <CategoryCard
                              title="Services"
                              total={doctor.revenueByCategory.services.total}
                              doctorShare={doctor.revenueByCategory.services.doctorShare}
                              clinicShare={doctor.revenueByCategory.services.clinicShare}
                              color="cyan"
                            />

                            {/* Medicine */}
                            <CategoryCard
                              title="Medicine"
                              total={doctor.revenueByCategory.medicine.total}
                              doctorShare={doctor.revenueByCategory.medicine.doctorShare}
                              clinicShare={doctor.revenueByCategory.medicine.clinicShare}
                              color="green"
                            />

                            {/* Labs */}
                            <CategoryCard
                              title="Labs"
                              total={doctor.revenueByCategory.labs.total}
                              doctorShare={doctor.revenueByCategory.labs.doctorShare}
                              clinicShare={doctor.revenueByCategory.labs.clinicShare}
                              color="amber"
                            />

                            {/* Other */}
                            <CategoryCard
                              title="Other"
                              total={doctor.revenueByCategory.other.total}
                              doctorShare={doctor.revenueByCategory.other.doctorShare}
                              clinicShare={doctor.revenueByCategory.other.clinicShare}
                              color="slate"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>

          {/* Grand Total Row */}
          <tfoot className="bg-slate-100 border-t-2 border-slate-300">
            <tr>
              <td colSpan="2" className="px-4 py-4 text-sm font-bold text-slate-900">
                GRAND TOTAL
              </td>
              <td className="px-4 py-4 text-sm text-center font-bold text-slate-900">
                {doctors.reduce((sum, d) => sum + d.consultationCount, 0)}
              </td>
              <td className="px-4 py-4 text-sm text-right font-bold text-slate-900">
                {formatCurrency(doctors.reduce((sum, d) => sum + d.totalRevenue, 0))}
              </td>
              <td className="px-4 py-4 text-sm text-right font-bold text-teal-600">
                {formatCurrency(doctors.reduce((sum, d) => sum + d.doctorShare, 0))}
              </td>
              <td className="px-4 py-4 text-sm text-right font-bold text-purple-600">
                {formatCurrency(doctors.reduce((sum, d) => sum + d.clinicShare, 0))}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

/**
 * Category Card Component
 * Displays revenue breakdown for a single category
 */
const CategoryCard = ({ title, total, doctorShare, clinicShare, color }) => {
  const formatCurrency = (amount) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    indigo: 'border-indigo-200 bg-indigo-50',
    cyan: 'border-cyan-200 bg-cyan-50',
    green: 'border-green-200 bg-green-50',
    amber: 'border-amber-200 bg-amber-50',
    slate: 'border-slate-200 bg-slate-50'
  }

  return (
    <div className={`border rounded-lg p-3 ${colorClasses[color]}`}>
      <h5 className="text-xs font-semibold text-slate-700 mb-2">{title}</h5>
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600">Total:</span>
          <span className="text-sm font-semibold text-slate-900">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600">Doctor (60%):</span>
          <span className="text-sm font-medium text-teal-600">{formatCurrency(doctorShare)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-600">Clinic (40%):</span>
          <span className="text-sm font-medium text-purple-600">{formatCurrency(clinicShare)}</span>
        </div>
      </div>
    </div>
  )
}

export default DoctorRevenueTable
