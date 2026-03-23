import { AlertCircle, RefreshCw } from 'lucide-react'
import SkeletonLoader from '../SkeletonLoader'
import useBillingFinancial from '../../hooks/useBillingFinancial'
import PeriodSelector from './PeriodSelector'
import FinancialKPIRow from './FinancialKPIRow'
import CashFlowChart from './CashFlowChart'
import DiscountSummary from './DiscountSummary'
import TransactionTable from './TransactionTable'

/**
 * FinancialTab — top-level container for the Billing Financial Tab.
 * Consumes useBillingFinancial and wires all sub-components together.
 */
export default function FinancialTab() {
  const {
    activePeriod,
    dateRange,
    data,
    loading,
    error,
    lastUpdated,
    activeFilter,
    setDateRange,
    toggleFilter,
    refresh,
  } = useBillingFinancial()

  const handleCashFlowClick = (method) => {
    toggleFilter(activeFilter?.paymentMethod === method ? null : { paymentMethod: method })
  }

  const handleDiscountClick = (type) => {
    toggleFilter(activeFilter?.discountType === type ? null : { discountType: type })
  }

  const handleFilterChange = (filter) => {
    // Sync table-driven filter changes back to hook
    if (Object.keys(filter).length === 0) {
      toggleFilter(null)
    }
  }

  return (
    <div className="pb-8">
      {/* Period selector */}
      <PeriodSelector
        activePeriod={activePeriod}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Failed to load financial data</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            {lastUpdated && (
              <p className="text-xs text-red-400 mt-0.5">
                Showing data from {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="px-6 pt-6 space-y-4">
          <SkeletonLoader variant="stats" columns={4} message="Loading KPIs..." />
          <SkeletonLoader variant="dashboard" message="Loading charts..." />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <FinancialKPIRow kpis={data.kpis} />

          {/* Cash flow chart */}
          <CashFlowChart
            data={data.cashFlow}
            activeSeries={activeFilter?.paymentMethod}
            onSeriesClick={handleCashFlowClick}
          />

          {/* Discount summary */}
          <DiscountSummary
            data={data.discounts.chartData}
            stats={data.discounts.stats}
            activeType={activeFilter?.discountType}
            onTypeClick={handleDiscountClick}
          />

          {/* Transaction table */}
          <TransactionTable
            records={data.transactions}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />
        </>
      )}
    </div>
  )
}
