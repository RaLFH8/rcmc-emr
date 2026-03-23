import { DollarSign, CreditCard, Tag, TrendingUp, AlertCircle } from 'lucide-react'
import KPICard from '../analytics/KPICard'

/**
 * FinancialKPIRow — renders five KPI cards for the Financial Tab.
 *
 * @param {Object} props
 * @param {{ totalRevenue, totalTransactions, totalDiscounts, netRevenue, unpaidBills }} props.kpis
 *   Each field: { current: number, previous: number }
 */
export default function FinancialKPIRow({ kpis }) {
  const { totalRevenue, totalTransactions, totalDiscounts, netRevenue, unpaidBills } = kpis

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 px-6 py-4">
      <KPICard
        title="Total Revenue"
        value={totalRevenue.current}
        previousValue={totalRevenue.previous}
        format="currency"
        icon={DollarSign}
        iconColor="bg-teal-500"
      />
      <KPICard
        title="Total Transactions"
        value={totalTransactions.current}
        previousValue={totalTransactions.previous}
        format="number"
        icon={CreditCard}
        iconColor="bg-blue-500"
      />
      <KPICard
        title="Total Discounts"
        value={totalDiscounts.current}
        previousValue={totalDiscounts.previous}
        format="currency"
        icon={Tag}
        iconColor="bg-amber-500"
      />
      <KPICard
        title="Net Revenue"
        value={netRevenue.current}
        previousValue={netRevenue.previous}
        format="currency"
        icon={TrendingUp}
        iconColor="bg-green-500"
      />
      <KPICard
        title="Unpaid Bills"
        value={unpaidBills.current}
        previousValue={unpaidBills.previous}
        format="currency"
        icon={AlertCircle}
        iconColor="bg-red-500"
      />
    </div>
  )
}
