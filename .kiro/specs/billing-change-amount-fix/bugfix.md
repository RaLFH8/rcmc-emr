# Bugfix Requirements Document

## Introduction

When a patient pays more cash than their bill total (e.g., bill is ₱1,250 and they hand over ₱1,300), the system correctly computes ₱50 change but incorrectly records `amount_paid` as ₱1,300 (the cash tendered) instead of ₱1,250 (the actual bill total). This causes the financial reports, net revenue KPIs, and receipt printouts to overstate how much was collected, since `amount_paid` is used as the "actual cash collected" figure throughout the billing module.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a patient tenders cash greater than the bill total THEN the system records `amount_paid` as the cash tendered amount (e.g., ₱1,300 instead of ₱1,250)

1.2 WHEN `amount_paid` is stored as the cash tendered amount THEN the system computes `remaining_balance` as a negative number (e.g., ₱1,250 − ₱1,300 = −₱50) instead of zero

1.3 WHEN the financial KPI `netRevenue` is computed THEN the system sums `amount_paid` values, inflating net revenue by the change amount for every overpaid transaction

### Expected Behavior (Correct)

2.1 WHEN a patient tenders cash greater than the bill total THEN the system SHALL record `amount_paid` as the bill total (e.g., ₱1,250), not the cash tendered

2.2 WHEN `amount_paid` is capped at the bill total THEN the system SHALL compute `remaining_balance` as zero for fully paid transactions

2.3 WHEN the financial KPI `netRevenue` is computed THEN the system SHALL reflect the true amount collected (bill total), with change tracked separately as `cash_tendered − total_amount`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a patient pays exactly the bill total THEN the system SHALL CONTINUE TO record `amount_paid` equal to `total_amount` and `remaining_balance` as zero

3.2 WHEN a patient makes a partial payment (less than the bill total) THEN the system SHALL CONTINUE TO record `amount_paid` as the partial amount and `remaining_balance` as the outstanding difference

3.3 WHEN a payment is marked as Paid via the status-change shortcut THEN the system SHALL CONTINUE TO set `amount_paid` to `total_amount` and `remaining_balance` to zero

3.4 WHEN a receipt PDF or print preview is generated THEN the system SHALL CONTINUE TO display the correct change amount (cash tendered − bill total) in the Change row
