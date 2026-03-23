import { useState, useEffect, useCallback } from 'react'
import {
  fetchFinancialData,
  fetchPreviousPeriodData,
  computeDateRange,
  computeKPIs,
  buildCashFlowData,
  buildDiscountChartData,
  computeDiscountStats,
} from '../services/billingFinancialService'

/**
 * Custom hook for the Billing Financial Tab.
 * Fetches billing data for the selected period, derives all shapes in-memory,
 * and exposes state + actions to the FinancialTab component.
 */
export function useBillingFinancial() {
  const today = new Date()
  const defaultRange = computeDateRange('monthly', today)

  const [activePeriod, setActivePeriod] = useState('monthly')
  const [dateRange, setDateRange] = useState(defaultRange)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null)

  const [data, setData] = useState({
    kpis: {
      totalRevenue: { current: 0, previous: 0 },
      totalTransactions: { current: 0, previous: 0 },
      totalDiscounts: { current: 0, previous: 0 },
      netRevenue: { current: 0, previous: 0 },
      unpaidBills: { current: 0, previous: 0 },
    },
    cashFlow: [],
    discounts: { chartData: [], stats: { total: 0, count: 0, average: 0, highest: 0 } },
    transactions: [],
  })

  const loadData = useCallback(async (range, period) => {
    setLoading(true)
    setError(null)
    try {
      const [current, previous] = await Promise.all([
        fetchFinancialData(range),
        fetchPreviousPeriodData(range),
      ])

      const currentKPIs = computeKPIs(current)
      const previousKPIs = computeKPIs(previous)

      setData({
        kpis: {
          totalRevenue: { current: currentKPIs.totalRevenue, previous: previousKPIs.totalRevenue },
          totalTransactions: { current: currentKPIs.totalTransactions, previous: previousKPIs.totalTransactions },
          totalDiscounts: { current: currentKPIs.totalDiscounts, previous: previousKPIs.totalDiscounts },
          netRevenue: { current: currentKPIs.netRevenue, previous: previousKPIs.netRevenue },
          unpaidBills: { current: currentKPIs.unpaidBills, previous: previousKPIs.unpaidBills },
        },
        cashFlow: buildCashFlowData(current, period || 'monthly'),
        discounts: {
          chartData: buildDiscountChartData(current),
          stats: computeDiscountStats(current),
        },
        transactions: current,
      })
      setLastUpdated(new Date())
    } catch (err) {
      console.error('useBillingFinancial fetch error:', err)
      setError(err.message || 'Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(dateRange, activePeriod)
  }, [dateRange, activePeriod, loadData])

  const handleSetDateRange = useCallback((range, period) => {
    if (period) setActivePeriod(period)
    setDateRange(range)
  }, [])

  const refresh = useCallback(() => {
    loadData(dateRange, activePeriod)
  }, [loadData, dateRange, activePeriod])

  /**
   * Toggles the active filter. If the same value is passed, clears the filter.
   * @param {Object|null} filterValue
   */
  const toggleFilter = useCallback((filterValue) => {
    setActiveFilter(prev => {
      if (!filterValue) return null
      // Compare by JSON to handle object equality
      if (JSON.stringify(prev) === JSON.stringify(filterValue)) return null
      return filterValue
    })
  }, [])

  return {
    activePeriod,
    dateRange,
    data,
    loading,
    error,
    lastUpdated,
    activeFilter,
    setDateRange: handleSetDateRange,
    setActiveFilter,
    toggleFilter,
    refresh,
  }
}

export default useBillingFinancial
