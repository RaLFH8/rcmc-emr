# Implementation Plan: Billing Financial Tab

## Overview

Add a Financial Tab to `Payments.jsx` as a second tab panel. All data comes from a single Supabase query per period against the existing `billing` table. KPIs, charts, and the transaction table are all derived in-memory from that one fetch. New components live under `src/components/billing/`; the service and hook follow the same patterns already used in `analyticsService.js` and `useAnalytics.js`.

## Tasks

- [x] 1. Create `billingFinancialService.js` — pure data functions
  - [x] 1.1 Scaffold `src/services/billingFinancialService.js` with the single Supabase query
    - Implement `fetchFinancialData(dateRange)`: SELECT billing + LEFT JOIN patients WHERE created_at BETWEEN startDate and endDate T23:59:59, ORDER BY created_at DESC
    - Implement `fetchPreviousPeriodData(dateRange)`: calls `fetchFinancialData` with the previous period window
    - Export `getPreviousPeriod(startDate, endDate)` helper (duration-based shift)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 1.2 Implement `computeDateRange(period, currentDate)` in the service
    - Handle 'daily', 'weekly' (Mon–Sun), 'monthly', 'yearly', 'custom' cases
    - Return `{ startDate: Date, endDate: Date }`
    - _Requirements: 1.5, 1.6, 1.7, 1.8_

  - [x] 1.3 Implement `validateDateRange(startDate, endDate)`
    - Return `{ valid: false, error: string }` when startDate > endDate, else `{ valid: true }`
    - _Requirements: 1.9_

  - [x] 1.4 Implement KPI derivation: `computeKPIs(records)`
    - `totalRevenue`: sum of `total_amount` (null → 0)
    - `totalTransactions`: `records.length`
    - `totalDiscounts`: sum of `discount_amount` (null → 0)
    - `netRevenue`: totalRevenue − totalDiscounts
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.10_

  - [x] 1.5 Implement `computePercentageChange(current, previous)`
    - Returns `((c − p) / p) * 100` when p > 0, else `null`
    - _Requirements: 2.6, 2.9_

  - [ ]* 1.6 Write property tests for `computeDateRange` (Property 1)
    - **Property 1: Period date range correctness**
    - **Validates: Requirements 1.5, 1.6, 1.7, 1.8**

  - [ ]* 1.7 Write property tests for `validateDateRange` (Property 2)
    - **Property 2: Invalid date range blocks fetch**
    - **Validates: Requirement 1.9**

  - [ ]* 1.8 Write property tests for `computeKPIs` — revenue, transactions, discounts, net (Properties 3–6)
    - **Property 3: KPI Total Revenue equals sum of total_amount**
    - **Property 4: KPI Total Transactions equals record count**
    - **Property 5: KPI Total Discounts equals sum of discount_amount**
    - **Property 6: Net Revenue invariant**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.10**

  - [ ]* 1.9 Write property tests for `computePercentageChange` (Properties 7–8)
    - **Property 7: KPI percentage change calculation**
    - **Property 8: Trend indicator sign matches change direction**
    - **Validates: Requirements 2.6, 2.7, 2.8, 2.9**

- [x] 2. Implement payment method and cash flow helpers
  - [x] 2.1 Implement `normalizePaymentMethod(value)` in the service
    - Maps Cash / GCash / Maya / Bank Transfer to canonical strings; everything else → "Others"
    - _Requirements: 3.3_

  - [x] 2.2 Implement `buildCashFlowData(records, periodType)`
    - Groups records into time buckets (hour / day-name / day-of-month / month-name / date string) per period type
    - Each bucket: `{ period, Cash, GCash, Maya, BankTransfer, Others }`
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 2.3 Write property tests for `normalizePaymentMethod` (Property 9)
    - **Property 9: Unknown payment method maps to Others**
    - **Validates: Requirement 3.3**

  - [ ]* 2.4 Write property tests for `buildCashFlowData` — totals invariant and bucket assignment (Properties 10–11)
    - **Property 10: Payment method totals sum to total revenue**
    - **Property 11: Cash flow grouping produces correct time buckets**
    - **Validates: Requirements 3.4–3.8, 3.11**

- [x] 3. Implement discount helpers
  - [x] 3.1 Implement `normalizeDiscountType(value)` in the service
    - Maps the seven defined categories; null / empty → excluded; anything else → "Others"
    - _Requirements: 4.3, 4.4_

  - [x] 3.2 Implement `buildDiscountChartData(records)` and `computeDiscountStats(records)`
    - `buildDiscountChartData`: returns `[{ type, amount }]` excluding zero/null discount records
    - `computeDiscountStats`: returns `{ total, count, average, highest }` over records with discount_amount > 0
    - _Requirements: 4.4, 4.5, 4.7_

  - [ ]* 3.3 Write property tests for `normalizeDiscountType` (Property 12)
    - **Property 12: Unknown discount type maps to Others**
    - **Validates: Requirement 4.3**

  - [ ]* 3.4 Write property tests for `computeDiscountStats` and `buildDiscountChartData` (Properties 13–14)
    - **Property 13: Discount stats panel values are mathematically correct**
    - **Property 14: Discount type totals sum to total discounts**
    - **Validates: Requirements 4.5, 4.7**

- [x] 4. Implement table utility functions
  - [x] 4.1 Implement `applyFilters(records, filter)` in the service
    - Accepts `{ paymentMethod?, discountType?, status? }`; applies all non-null conditions simultaneously
    - _Requirements: 5.4_

  - [x] 4.2 Implement `sortRecords(records, column, direction)`
    - Supports all table columns; both 'asc' and 'desc'
    - _Requirements: 5.5_

  - [x] 4.3 Implement `paginate(records, page, pageSize)`
    - Returns slice of length `min(pageSize, remaining)`
    - _Requirements: 5.3_

  - [x] 4.4 Implement `exportToCSV(rows)`
    - Serializes filtered+sorted transaction rows to CSV string with correct column headers
    - Triggers browser download
    - _Requirements: 5.8, 5.9, 5.11_

  - [ ]* 4.5 Write property tests for `applyFilters`, `sortRecords`, `paginate`, `exportToCSV` (Properties 15–18)
    - **Property 15: Table pagination shows at most page_size records**
    - **Property 16: Table multi-filter returns only matching records**
    - **Property 17: Table sort produces correctly ordered results**
    - **Property 18: CSV export round-trip**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.11**

- [x] 5. Checkpoint — Ensure all service-layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create `useBillingFinancial.js` hook
  - [x] 6.1 Scaffold `src/hooks/useBillingFinancial.js`
    - State: `dateRange`, `activePeriod`, `data` (kpis, cashFlow, discounts, transactions), `loading`, `error`, `lastUpdated`
    - On `dateRange` change: call `fetchFinancialData` + `fetchPreviousPeriodData`, derive all shapes in-memory, update state
    - Expose `setDateRange`, `refresh`, `activeFilter`, `setActiveFilter`
    - _Requirements: 1.4, 7.1, 7.2, 7.3, 7.5_

  - [x] 6.2 Implement `toggleFilter(filterValue)` inside the hook
    - If `filterValue` equals current `activeFilter`, set to `null`; otherwise set to `filterValue`
    - _Requirements: 6.4_

  - [ ]* 6.3 Write property test for `toggleFilter` (Property 19)
    - **Property 19: Filter toggle removes active filter**
    - **Validates: Requirement 6.4**

- [x] 7. Build `PeriodSelector.jsx`
  - [x] 7.1 Create `src/components/billing/PeriodSelector.jsx`
    - Four preset buttons (Daily / Weekly / Monthly / Yearly) + custom date range picker
    - Calls `computeDateRange` on preset click; validates with `validateDateRange` on custom confirm
    - Shows inline error when startDate > endDate; does not call `onDateRangeChange` in that case
    - Highlights active period button
    - Sticky positioning via Tailwind `sticky top-0 z-10`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.9, 1.10_

- [x] 8. Build `FinancialKPIRow.jsx`
  - [x] 8.1 Create `src/components/billing/FinancialKPIRow.jsx`
    - Renders four `KPICard` instances (reuse `src/components/analytics/KPICard.jsx`)
    - Cards: Total Revenue (currency), Total Transactions (number), Total Discounts (currency), Net Revenue (currency)
    - Passes `value` (current) and `previousValue` (previous period) to each card so KPICard handles trend display
    - When `previousValue === 0`, KPICard already shows "N/A" via `calculatePercentageChange` returning null
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 9. Build `CashFlowChart.jsx`
  - [x] 9.1 Create `src/components/billing/CashFlowChart.jsx`
    - Recharts `BarChart` (stacked) with one `Bar` per payment method (Cash, GCash, Maya, BankTransfer, Others)
    - X-axis label from `buildCashFlowData` bucket keys
    - `onSeriesClick` fires with the clicked payment method string
    - Visually dims unselected series when `activeSeries` is set
    - Summary row below chart: total + percentage share per method
    - _Requirements: 3.1, 3.2, 3.9, 3.10_

- [x] 10. Build `DiscountSummary.jsx`
  - [x] 10.1 Create `src/components/billing/DiscountSummary.jsx`
    - Two-column layout: Recharts horizontal `BarChart` on left, stats panel on right
    - Stats panel: total discount, count, average, highest
    - `onTypeClick` fires with the clicked discount type string
    - Dims unselected bars when `activeType` is set
    - _Requirements: 4.1, 4.2, 4.5, 4.6_

- [x] 11. Build `TransactionTable.jsx`
  - [x] 11.1 Create `src/components/billing/TransactionTable.jsx`
    - Columns: Date/Time, Patient Name, Bill Amount, Discount Type, Discount Amount, Net Amount, Payment Method, Status
    - Pagination: default page size 10, configurable to 25/50
    - Multi-filter dropdowns for Payment Method, Discount Type, Status
    - Sort toggle on all column headers (asc/desc)
    - Active filter chips with individual clear + "Clear All" button
    - Export CSV button calls `exportToCSV` on current filtered+sorted view
    - Empty state message when no records match
    - Scrolls into view when `activeFilter` changes via chart click
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

- [x] 12. Build `FinancialTab.jsx` and wire all sections together
  - [x] 12.1 Create `src/components/billing/FinancialTab.jsx`
    - Consumes `useBillingFinancial` hook
    - Renders `PeriodSelector` → `FinancialKPIRow` → `CashFlowChart` → `DiscountSummary` → `TransactionTable` in order
    - Passes `activeFilter` / `setActiveFilter` (via `toggleFilter`) down to chart and table components
    - Shows skeleton placeholders (`SkeletonLoader`) while `loading === true`
    - Shows error banner with retry button when `error` is set; retry calls `refresh()`
    - Shows stale data indicator (`lastUpdated` timestamp) when previous data is displayed after a network error
    - Shows "No data for this period" in charts and zero KPIs when result set is empty
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 13. Integrate `FinancialTab` into `Payments.jsx`
  - [x] 13.1 Add a two-tab bar at the top of `Payments.jsx`
    - Tab 1: "Transactions" (existing content, unchanged)
    - Tab 2: "Financial" (renders `<FinancialTab />`)
    - Active tab highlighted; switching tabs does not re-fetch existing Transactions data
    - _Requirements: 1.1 (tab host), 6.6_

- [x] 14. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use **fast-check** (already in the project); tag each test with `// Feature: billing-financial-tab, Property N: <text>`
- Each property test runs a minimum of 100 iterations
- All new components live under `src/components/billing/`
- No new Supabase tables or migrations required
