# Requirements Document

## Introduction

The Billing Financial Tab is a dedicated analytics and reporting section within the RCMC EMR Payments page. It provides clinic administrators and receptionists with a comprehensive financial overview of billing activity — including revenue summaries, cash flow by payment method, discount breakdowns, and a filterable transaction table — all driven by a period selector. All data is sourced exclusively from the existing `billing` table in Supabase; no new database tables are required.

## Glossary

- **Financial_Tab**: The analytics tab rendered inside the Payments page that displays financial KPIs, charts, and the transaction table.
- **Period_Selector**: The sticky toggle control at the top of the Financial_Tab that allows the user to choose Daily, Weekly, Monthly, Yearly, or a Custom date range.
- **KPI_Card**: A summary card displaying a single financial metric and its percentage change versus the previous equivalent period.
- **Cash_Flow_Chart**: A stacked or grouped bar chart showing collections over time broken down by payment method.
- **Discount_Chart**: A horizontal bar chart showing discount amounts grouped by discount type.
- **Transaction_Table**: A paginated, filterable, sortable table of individual billing records for the selected period.
- **Payment_Method**: One of: Cash, GCash, Maya, Bank Transfer, or Others (catch-all for unrecognized values).
- **Discount_Type**: One of: Senior Citizen, PWD, PhilHealth, HMO/Insurance, Employee/Staff, Custom/Manual, or None.
- **Net_Revenue**: Total Revenue minus Total Discounts Given for the selected period.
- **Previous_Period**: The period immediately preceding the selected period with the same duration (e.g., if the selected period is this week, the previous period is last week).
- **Active_Filter**: A payment method or discount type that the user has clicked to narrow the Transaction_Table.

---

## Requirements

### Requirement 1: Period Selector

**User Story:** As a receptionist or admin, I want to select a time period at the top of the Financial Tab, so that all charts, KPI cards, and the transaction table update simultaneously to reflect only that period's data.

#### Acceptance Criteria

1. THE Financial_Tab SHALL render a sticky Period_Selector at the top of the page that remains visible while scrolling.
2. THE Period_Selector SHALL provide four toggle buttons: Daily, Weekly, Monthly, and Yearly.
3. THE Period_Selector SHALL provide a custom date range picker with a start date and end date input.
4. WHEN the user selects a period toggle or confirms a custom date range, THE Financial_Tab SHALL re-fetch all billing data for the selected date range and re-render all sections below.
5. WHEN the user selects Daily, THE Period_Selector SHALL set the date range to the current calendar day.
6. WHEN the user selects Weekly, THE Period_Selector SHALL set the date range to the current calendar week (Monday through Sunday).
7. WHEN the user selects Monthly, THE Period_Selector SHALL set the date range to the current calendar month.
8. WHEN the user selects Yearly, THE Period_Selector SHALL set the date range to the current calendar year.
9. WHEN the user selects a custom date range where the start date is after the end date, THE Period_Selector SHALL display a validation error and SHALL NOT trigger a data fetch.
10. THE Period_Selector SHALL highlight the currently active period toggle to indicate the selected state.

---

### Requirement 2: Summary KPI Cards

**User Story:** As a receptionist or admin, I want to see four summary KPI cards at the top of the Financial Tab, so that I can quickly understand the financial performance of the selected period at a glance.

#### Acceptance Criteria

1. THE Financial_Tab SHALL render four KPI_Cards in a single row: Total Revenue, Total Transactions, Total Discounts Given, and Net Revenue.
2. WHEN billing data is loaded for the selected period, THE KPI_Card for Total Revenue SHALL display the sum of `total_amount` across all billing records in that period.
3. WHEN billing data is loaded for the selected period, THE KPI_Card for Total Transactions SHALL display the count of billing records in that period.
4. WHEN billing data is loaded for the selected period, THE KPI_Card for Total Discounts Given SHALL display the sum of `discount_amount` across all billing records in that period.
5. WHEN billing data is loaded for the selected period, THE KPI_Card for Net Revenue SHALL display the value of Total Revenue minus Total Discounts Given for that period.
6. WHEN billing data is loaded for the selected period, EACH KPI_Card SHALL display the percentage change of its metric compared to the equivalent Previous_Period.
7. WHEN the percentage change is positive, THE KPI_Card SHALL display the percentage in green with an upward arrow icon.
8. WHEN the percentage change is negative, THE KPI_Card SHALL display the percentage in red with a downward arrow icon.
9. WHEN the Previous_Period has no data (zero baseline), THE KPI_Card SHALL display "N/A" instead of a percentage change.
10. FOR ALL billing records in a period, the Net Revenue value SHALL equal Total Revenue minus Total Discounts Given (invariant: `net_revenue = total_revenue - total_discounts`).

---

### Requirement 3: Cash Flow by Payment Method Chart

**User Story:** As a receptionist or admin, I want to see a bar chart of collections over time broken down by payment method, so that I can understand which payment channels are most used and how collections trend across the selected period.

#### Acceptance Criteria

1. THE Financial_Tab SHALL render a Cash_Flow_Chart as a stacked or grouped bar chart below the KPI_Cards.
2. THE Cash_Flow_Chart SHALL display five payment method series: Cash, GCash, Maya, Bank Transfer, and Others.
3. WHEN a billing record's `payment_method` value does not match Cash, GCash, Maya, or Bank Transfer, THE Cash_Flow_Chart SHALL assign that record to the Others series.
4. WHEN the selected period is Daily, THE Cash_Flow_Chart x-axis SHALL group data by hour of day.
5. WHEN the selected period is Weekly, THE Cash_Flow_Chart x-axis SHALL group data by day of week.
6. WHEN the selected period is Monthly, THE Cash_Flow_Chart x-axis SHALL group data by day of month.
7. WHEN the selected period is Yearly, THE Cash_Flow_Chart x-axis SHALL group data by month of year.
8. WHEN a custom date range is selected, THE Cash_Flow_Chart x-axis SHALL group data by day.
9. THE Cash_Flow_Chart SHALL render a summary row below the chart showing the total collection amount per payment method and each method's percentage share of total collections.
10. WHEN the user clicks a bar segment in the Cash_Flow_Chart, THE Transaction_Table SHALL filter to show only records matching that payment method.
11. FOR ALL periods, the sum of all payment method totals in the Cash_Flow_Chart SHALL equal the Total Revenue value shown in the KPI_Cards (invariant: `sum(method_totals) = total_revenue`).

---

### Requirement 4: Discount Summary

**User Story:** As a receptionist or admin, I want to see a breakdown of discounts by type, so that I can understand how much discount is being given and to which patient categories.

#### Acceptance Criteria

1. THE Financial_Tab SHALL render a Discount_Chart as a horizontal bar chart showing discount amounts grouped by Discount_Type.
2. THE Discount_Chart SHALL display the following discount type categories: Senior Citizen, PWD, PhilHealth, HMO/Insurance, Employee/Staff, Custom/Manual, and a catch-all Others for unrecognized types.
3. WHEN a billing record has a `discount_type` value that does not match any defined Discount_Type category, THE Discount_Chart SHALL assign that record to the Others category.
4. WHEN a billing record has no `discount_type` or a zero `discount_amount`, THE Discount_Chart SHALL exclude that record from all discount categories.
5. THE Financial_Tab SHALL render a stats panel adjacent to the Discount_Chart showing: Total discount amount, Number of transactions with discounts, Average discount per discounted transaction, and Highest single discount amount.
6. WHEN the user clicks a bar in the Discount_Chart, THE Transaction_Table SHALL filter to show only records matching that discount type.
7. FOR ALL periods, the sum of all discount type amounts in the Discount_Chart SHALL equal the Total Discounts Given value shown in the KPI_Cards (invariant: `sum(discount_type_amounts) = total_discounts`).

---

### Requirement 5: Transaction Table

**User Story:** As a receptionist or admin, I want to see a paginated table of all billing transactions for the selected period, so that I can review individual records and drill into specific transactions.

#### Acceptance Criteria

1. THE Financial_Tab SHALL render a Transaction_Table below the charts showing all billing records for the selected period.
2. THE Transaction_Table SHALL display the following columns: Date/Time, Patient Name, Bill Amount, Discount Type, Discount Amount, Net Amount, Payment Method, and Status.
3. THE Transaction_Table SHALL support pagination with a configurable page size.
4. THE Transaction_Table SHALL support filtering by Payment Method, Discount Type, and Status simultaneously.
5. THE Transaction_Table SHALL support ascending and descending sort on all columns.
6. THE Transaction_Table SHALL display a filter indicator showing which Active_Filters are currently applied.
7. WHEN an Active_Filter is applied, THE Transaction_Table SHALL provide a clear/reset button to remove all active filters.
8. THE Transaction_Table SHALL provide an Export to CSV button that downloads all records matching the current filters and selected period.
9. WHEN the Export to CSV button is clicked, THE Transaction_Table SHALL generate a CSV file containing all filtered records with the same columns as the table.
10. WHEN no records match the current filters, THE Transaction_Table SHALL display an empty state message.
11. FOR ALL exported CSV files, parsing the CSV and re-importing the data SHALL produce a record set equivalent to the filtered table data (round-trip property).

---

### Requirement 6: Cross-Section Interactivity

**User Story:** As a receptionist or admin, I want clicking on chart elements to filter the transaction table, so that I can quickly drill down from a visual summary into the underlying records.

#### Acceptance Criteria

1. WHEN the user clicks a payment method segment in the Cash_Flow_Chart, THE Transaction_Table SHALL apply a Payment Method filter matching the clicked segment and scroll into view.
2. WHEN the user clicks a discount type bar in the Discount_Chart, THE Transaction_Table SHALL apply a Discount Type filter matching the clicked bar and scroll into view.
3. WHEN an Active_Filter is set via chart interaction, THE Transaction_Table SHALL visually highlight the active filter in the filter controls.
4. WHEN the user clicks the same chart segment again, THE Transaction_Table SHALL toggle the filter off (deselect).
5. WHILE an Active_Filter is applied, THE Cash_Flow_Chart and Discount_Chart SHALL visually indicate which segment is selected (e.g., highlight or opacity change on unselected segments).
6. THE Period_Selector SHALL drive all sections simultaneously — KPI_Cards, Cash_Flow_Chart, Discount_Chart, and Transaction_Table SHALL all reflect the same selected date range at all times.

---

### Requirement 7: Data Loading and Error Handling

**User Story:** As a receptionist or admin, I want the Financial Tab to handle loading states and errors gracefully, so that I always know the status of the data being displayed.

#### Acceptance Criteria

1. WHEN billing data is being fetched, THE Financial_Tab SHALL display skeleton loading placeholders for all sections.
2. WHEN a data fetch fails, THE Financial_Tab SHALL display an error message with a retry button.
3. WHEN the retry button is clicked, THE Financial_Tab SHALL re-attempt the data fetch for the current period.
4. WHEN the selected period returns zero billing records, THE Financial_Tab SHALL display zero values in KPI_Cards, empty charts with a "No data for this period" message, and an empty Transaction_Table.
5. IF a network error occurs during data fetch, THEN THE Financial_Tab SHALL display the last successfully loaded data with a stale data indicator showing the time of the last successful fetch.
