import React from 'react'
import { Users, DollarSign, TrendingUp, Building2 } from 'lucide-react'
import KPICard from '../analytics/KPICard'

/**
 * Revenue Summary Cards Component
 * 
 * Displays summary statistics for the Doctor Revenue Sharing Report.
 * Shows total consultations, total revenue, total doctor share, and total clinic share
 * with visual cards using the KPICard component for consistency.
 * 
 * Validates: Requirements 6.1, 6.2, 6.4, 6.7
 * 
 * @param {Object} props - Component props
 * @param {number} props.totalConsultations - Total number of consultations
 * @param {number} props.totalRevenue - Total revenue amount
 * @param {number} props.totalDoctorShare - Total doctor share (60%)
 * @param {number} props.totalClinicShare - Total clinic share (40%)
 * @param {number} [props.dataQualityScore] - Data quality score percentage (optional)
 */
const RevenueSummaryCards = ({
  totalConsultations,
  totalRevenue,
  totalDoctorShare,
  totalClinicShare,
  dataQualityScore
}) => {
  // Calculate percentages for display
  const doctorPercentage = totalRevenue > 0 ? (totalDoctorShare / totalRevenue) * 100 : 60
  const clinicPercentage = totalRevenue > 0 ? (totalClinicShare / totalRevenue) * 100 : 40

  return (
    <div className="space-y-4">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Consultations Card */}
        <KPICard
          title="Total Consultations"
          value={totalConsultations}
          previousValue={0}
          format="number"
          icon={Users}
          iconColor="bg-blue-500"
          trend="neutral"
          description="All doctors"
        />

        {/* Total Revenue Card */}
        <KPICard
          title="Total Revenue"
          value={totalRevenue}
          previousValue={0}
          format="currency"
          icon={DollarSign}
          iconColor="bg-green-500"
          trend="neutral"
          description="All categories"
        />

        {/* Total Doctor Share Card */}
        <KPICard
          title="Total Doctor Share"
          value={totalDoctorShare}
          previousValue={0}
          format="currency"
          icon={TrendingUp}
          iconColor="bg-teal-500"
          trend="neutral"
          description={`${doctorPercentage.toFixed(0)}% of revenue`}
        />

        {/* Total Clinic Share Card */}
        <KPICard
          title="Total Clinic Share"
          value={totalClinicShare}
          previousValue={0}
          format="currency"
          icon={Building2}
          iconColor="bg-purple-500"
          trend="neutral"
          description={`${clinicPercentage.toFixed(0)}% of revenue`}
        />
      </div>

      {/* Revenue Split Indicator */}
      <div className="bg-gradient-to-r from-teal-50 to-purple-50 rounded-lg p-4 border border-teal-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-teal-500"></div>
              <span className="text-sm font-medium text-slate-700">
                Doctor Share: 60%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm font-medium text-slate-700">
                Clinic Share: 40%
              </span>
            </div>
          </div>
          
          {/* Data Quality Indicator */}
          {dataQualityScore !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Data Quality:
              </span>
              <span className={`text-sm font-semibold ${
                dataQualityScore >= 90 ? 'text-green-600' :
                dataQualityScore >= 70 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {dataQualityScore.toFixed(1)}%
              </span>
              <div 
                className="group relative"
                role="tooltip"
              >
                <svg 
                  className="w-4 h-4 text-slate-400 cursor-help" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10">
                  Percentage of consultations with complete billing information. 
                  Higher scores indicate better data completeness.
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Visual Split Bar */}
        <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden flex">
          <div 
            className="bg-teal-500 transition-all duration-500"
            style={{ width: '60%' }}
            aria-label="Doctor share: 60%"
          ></div>
          <div 
            className="bg-purple-500 transition-all duration-500"
            style={{ width: '40%' }}
            aria-label="Clinic share: 40%"
          ></div>
        </div>
      </div>
    </div>
  )
}

export default RevenueSummaryCards
