# Implementation Tasks

## Tasks

- [x] 1. Fix `getTotalRevenue` lower boundary in `analyticsService.js`
  - Change `.gte('created_at', startDate)` to `.gte('created_at', \`${startDate}T00:00:00\`)` so the daily filter includes records created at local midnight
  - **File**: `rcmc-emr/src/services/analyticsService.js`

- [x] 2. Add `getNetRevenue` helper to `analyticsService.js`
  - New private function that fetches `amount_paid` and `discount_amount` from `billing` for the given date range
  - Returns `sum(amount_paid) - sum(discount_amount)` rounded to 2 decimal places
  - Uses the same `T00:00:00` / `T23:59:59` boundaries
  - **File**: `rcmc-emr/src/services/analyticsService.js`

- [x] 3. Add `getAccountsReceivable` helper to `analyticsService.js`
  - New private function that fetches `remaining_balance` from `billing` where `payment_status != 'Cancelled'`
  - Returns the sum rounded to 2 decimal places
  - Uses the same `T00:00:00` / `T23:59:59` boundaries
  - **File**: `rcmc-emr/src/services/analyticsService.js`

- [x] 4. Expand `getKPIMetrics` `Promise.all` to include new metrics
  - Add `currentNetRevenue`, `previousNetRevenue`, `currentAR`, `previousAR` to the parallel fetch
  - Add `netRevenue` and `accountsReceivable` objects to the returned metrics with `current`, `previous`, `change`, and `changePercentage` fields
  - **File**: `rcmc-emr/src/services/analyticsService.js`

- [x] 5. Fix `getRevenueTrend` timezone grouping
  - Replace `new Date(bill.created_at)` date extraction with `bill.created_at.substring(0, 10)` to get the local date string directly
  - Derive `year`, `month`, `day` from the date string instead of from a Date object
  - **File**: `rcmc-emr/src/services/analyticsService.js`

- [x] 6. Add Net Revenue and Accounts Receivable KPI cards to `Reports.jsx`
  - Add `<KPICard>` for Net Revenue (Tag icon, `bg-emerald-500`)
  - Add `<KPICard>` for Accounts Receivable (CreditCard icon, `bg-orange-500`)
  - Update KPI grid class from `lg:grid-cols-4` to `sm:grid-cols-2 lg:grid-cols-3` to accommodate 6 cards
  - **File**: `rcmc-emr/src/pages/Reports.jsx`
