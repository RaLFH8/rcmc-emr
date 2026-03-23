# Daily Rate Salary Calculation - UPDATED ✅

## What Changed

The payroll system now calculates salaries based on:
**Daily Rate × Number of Days Worked**

### Old Calculation (Weekly)
- Fixed 7 days for all weekly payroll
- Weekly Salary = (Monthly Salary ÷ 30) × 7

### New Calculation (Weekly)
- Based on actual work days between start and end date
- Weekly Salary = (Monthly Salary ÷ 30) × Actual Days Worked

## How It Works

### Daily Rate Formula
```
Daily Rate = Monthly Salary ÷ 30
```

### Salary Calculation
```
Salary = Daily Rate × Number of Days Worked
```

### Work Days Calculation
```
Work Days = (End Date - Start Date) + 1
```

## Examples

### Example 1: Full Week (Monday to Sunday)
- Employee: Basic Salary = ₱30,000/month
- Period: Jan 6 (Mon) to Jan 12 (Sun) = 7 days
- Daily Rate: ₱30,000 ÷ 30 = ₱1,000/day
- Salary: ₱1,000 × 7 days = ₱7,000

### Example 2: Partial Week (Monday to Wednesday)
- Employee: Basic Salary = ₱30,000/month
- Period: Jan 6 (Mon) to Jan 8 (Wed) = 3 days
- Daily Rate: ₱30,000 ÷ 30 = ₱1,000/day
- Salary: ₱1,000 × 3 days = ₱3,000

### Example 3: Two Weeks (Monday to Saturday)
- Employee: Basic Salary = ₱30,000/month
- Period: Jan 6 (Mon) to Jan 18 (Sat) = 13 days
- Daily Rate: ₱30,000 ÷ 30 = ₱1,000/day
- Salary: ₱1,000 × 13 days = ₱13,000

### Example 4: Monthly Payroll
- Employee: Basic Salary = ₱30,000/month
- Period: January 2025 (full month)
- Salary: ₱30,000 (no calculation needed)

## Deductions Calculation

All deductions are also prorated based on actual work days:

### SSS Contribution
```
Monthly SSS = SSS Salary × 7.5%
Weekly SSS = (Monthly SSS ÷ 30) × Work Days
```

Example:
- SSS Salary: ₱30,000
- Monthly SSS: ₱30,000 × 7.5% = ₱2,250
- For 7 days: (₱2,250 ÷ 30) × 7 = ₱525
- For 3 days: (₱2,250 ÷ 30) × 3 = ₱225

### PhilHealth & Pag-IBIG
```
Weekly Deduction = (Monthly Deduction ÷ 30) × Work Days
```

Example:
- Monthly PhilHealth: ₱600
- For 7 days: (₱600 ÷ 30) × 7 = ₱140
- For 3 days: (₱600 ÷ 30) × 3 = ₱60

### Cash Advance
```
Weekly Cash Advance = (Monthly Cash Advance ÷ 30) × Work Days
```

Example:
- Monthly Cash Advance: ₱3,000
- For 7 days: (₱3,000 ÷ 30) × 7 = ₱700
- For 3 days: (₱3,000 ÷ 30) × 3 = ₱300

### Incentive
```
Incentive = Full Amount (NOT prorated)
```

Incentives are always added in full, regardless of work days.

## Complete Payroll Example

### Employee Details
- Name: Juan Dela Cruz
- Basic Salary: ₱30,000/month
- SSS Salary: ₱30,000
- PhilHealth: ₱600/month
- Pag-IBIG: ₱200/month
- Cash Advance: ₱3,000/month
- Incentive: ₱1,000

### Scenario: 7 Days (Jan 6-12)

**Earnings:**
- Salary: (₱30,000 ÷ 30) × 7 = ₱7,000
- Incentive: ₱1,000
- **Subtotal: ₱8,000**

**Deductions:**
- SSS: (₱2,250 ÷ 30) × 7 = ₱525
- PhilHealth: (₱600 ÷ 30) × 7 = ₱140
- Pag-IBIG: (₱200 ÷ 30) × 7 = ₱46.67
- Cash Advance: (₱3,000 ÷ 30) × 7 = ₱700
- **Total Deductions: ₱1,411.67**

**Net Pay: ₱8,000 - ₱1,411.67 = ₱6,588.33**

### Scenario: 3 Days (Jan 6-8)

**Earnings:**
- Salary: (₱30,000 ÷ 30) × 3 = ₱3,000
- Incentive: ₱1,000
- **Subtotal: ₱4,000**

**Deductions:**
- SSS: (₱2,250 ÷ 30) × 3 = ₱225
- PhilHealth: (₱600 ÷ 30) × 3 = ₱60
- Pag-IBIG: (₱200 ÷ 30) × 3 = ₱20
- Cash Advance: (₱3,000 ÷ 30) × 3 = ₱300
- **Total Deductions: ₱605**

**Net Pay: ₱4,000 - ₱605 = ₱3,395**

## How to Use

1. Go to Payroll page
2. Click "Weekly" button
3. Select Start Date (e.g., Jan 6, 2025)
4. Select End Date (e.g., Jan 12, 2025)
5. System automatically calculates:
   - Number of days worked
   - Salary based on daily rate × days
   - All deductions prorated by days
   - Net pay

## Benefits

✅ Flexible pay periods (any number of days)
✅ Accurate prorated calculations
✅ Fair deductions based on actual work days
✅ Works for partial weeks, full weeks, or custom periods
✅ Automatic calculation - no manual math needed

## Files Modified

- ✅ `src/pages/Payroll.jsx` - Updated all salary and deduction calculations

## Status: Ready to Use

All changes are complete and tested. The system now calculates based on actual work days!
