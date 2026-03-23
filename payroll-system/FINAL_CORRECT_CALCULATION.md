# Payroll Calculation - FINAL CORRECT FORMULA ✅

## Important: Basic Salary is DAILY RATE

The "Basic Salary" field in the employee record represents the DAILY RATE, not monthly salary.

---

## Salary Calculation

### Formula
```
Salary = Basic Salary × Work Days
```

Where:
- **Basic Salary** = Daily rate (stored in employee record)
- **Work Days** = Number of days in the pay period

### Monthly Payroll
```
Work Days = 30 (full month)
Salary = Basic Salary × 30
```

### Weekly Payroll
```
Work Days = Number of days between Start Date and End Date
Salary = Basic Salary × Work Days
```

### Examples

**Example 1: Monthly (30 days)**
- Basic Salary (Daily Rate): ₱1,000/day
- Work Days: 30
- Salary: ₱1,000 × 30 = ₱30,000

**Example 2: Weekly (7 days)**
- Basic Salary (Daily Rate): ₱1,000/day
- Work Days: 7
- Salary: ₱1,000 × 7 = ₱7,000

**Example 3: Partial Week (3 days)**
- Basic Salary (Daily Rate): ₱1,000/day
- Work Days: 3
- Salary: ₱1,000 × 3 = ₱3,000

**Example 4: Two Weeks (14 days)**
- Basic Salary (Daily Rate): ₱1,000/day
- Work Days: 14
- Salary: ₱1,000 × 14 = ₱14,000

---

## SSS Contribution

### Formula
```
Monthly SSS = SSS Salary × 7.5%
Weekly SSS = Monthly SSS ÷ 4
```

### Monthly Payroll
```
SSS = SSS Salary × 7.5%
```

### Weekly Payroll
```
SSS = (SSS Salary × 7.5%) ÷ 4
```

### Examples

**Monthly SSS:**
- SSS Salary: ₱30,000
- SSS = ₱30,000 × 7.5% = ₱2,250

**Weekly SSS:**
- SSS Salary: ₱30,000
- Monthly SSS: ₱30,000 × 7.5% = ₱2,250
- Weekly SSS: ₱2,250 ÷ 4 = ₱562.50

**Note:** SSS is NOT prorated by actual work days. Weekly is always Monthly ÷ 4.

---

## PhilHealth Contribution

### Formula
```
PhilHealth = Manually Input Amount (stored in employee record)
```

- NOT calculated automatically
- NOT prorated
- Use the exact amount stored in the employee's PhilHealth field
- Set in Employees page

### Examples
- Employee PhilHealth: ₱600
- Monthly: ₱600
- Weekly: ₱600 (same amount)

---

## Pag-IBIG Contribution

### Formula
```
Pag-IBIG = Manually Input Amount (stored in employee record)
```

- NOT calculated automatically
- NOT prorated
- Use the exact amount stored in the employee's Pag-IBIG field
- Set in Employees page

### Examples
- Employee Pag-IBIG: ₱200
- Monthly: ₱200
- Weekly: ₱200 (same amount)

---

## Cash Advance

### Formula
```
Cash Advance = Manually Input Amount (editable in Payroll page)
```

- NOT prorated
- Editable directly in the Payroll Breakdown table
- Click on the amount to edit
- Added to total deductions

### Examples
- Employee Cash Advance: ₱3,000
- Monthly: ₱3,000
- Weekly: ₱3,000 (same amount)

---

## Incentive

### Formula
```
Incentive = Manually Input Amount (editable in Payroll page)
```

- NOT prorated
- Full amount always
- Editable directly in the Payroll Breakdown table
- Click on the amount to edit
- Added to salary (not deducted)

### Examples
- Employee Incentive: ₱1,000
- Monthly: ₱1,000
- Weekly: ₱1,000 (same amount)

---

## Complete Payroll Example

### Employee Details
- Name: Juan Dela Cruz
- Basic Salary (Daily Rate): ₱1,000/day
- SSS Salary: ₱30,000
- PhilHealth: ₱600 (manually set)
- Pag-IBIG: ₱200 (manually set)
- Cash Advance: ₱3,000 (manually set)
- Incentive: ₱1,000 (manually set)

---

### Scenario 1: Monthly Payroll (30 days)

**Earnings:**
- Salary: ₱1,000 × 30 = ₱30,000
- Incentive: ₱1,000
- **Subtotal: ₱31,000**

**Deductions:**
- SSS: ₱30,000 × 7.5% = ₱2,250
- PhilHealth: ₱600
- Pag-IBIG: ₱200
- Cash Advance: ₱3,000
- **Total Deductions: ₱6,050**

**Net Pay: ₱31,000 - ₱6,050 = ₱24,950**

---

### Scenario 2: Weekly Payroll (7 days)

**Earnings:**
- Salary: ₱1,000 × 7 = ₱7,000
- Incentive: ₱1,000
- **Subtotal: ₱8,000**

**Deductions:**
- SSS: ₱2,250 ÷ 4 = ₱562.50
- PhilHealth: ₱600
- Pag-IBIG: ₱200
- Cash Advance: ₱3,000
- **Total Deductions: ₱4,362.50**

**Net Pay: ₱8,000 - ₱4,362.50 = ₱3,637.50**

---

### Scenario 3: Partial Week (3 days)

**Earnings:**
- Salary: ₱1,000 × 3 = ₱3,000
- Incentive: ₱1,000
- **Subtotal: ₱4,000**

**Deductions:**
- SSS: ₱2,250 ÷ 4 = ₱562.50
- PhilHealth: ₱600
- Pag-IBIG: ₱200
- Cash Advance: ₱3,000
- **Total Deductions: ₱4,362.50**

**Net Pay: ₱4,000 - ₱4,362.50 = -₱362.50** (negative!)

---

### Scenario 4: Two Weeks (14 days)

**Earnings:**
- Salary: ₱1,000 × 14 = ₱14,000
- Incentive: ₱1,000
- **Subtotal: ₱15,000**

**Deductions:**
- SSS: ₱2,250 ÷ 4 = ₱562.50
- PhilHealth: ₱600
- Pag-IBIG: ₱200
- Cash Advance: ₱3,000
- **Total Deductions: ₱4,362.50**

**Net Pay: ₱15,000 - ₱4,362.50 = ₱10,637.50**

---

## Summary of Rules

| Item | Formula | Prorated? | Editable? |
|------|---------|-----------|-----------|
| **Salary** | Basic Salary × Work Days | ✅ Yes | ❌ No |
| **SSS** | Monthly: SSS Salary × 7.5%<br>Weekly: Monthly ÷ 4 | ❌ No | ❌ No |
| **PhilHealth** | Stored Amount | ❌ No | ✅ Yes (in Employees) |
| **Pag-IBIG** | Stored Amount | ❌ No | ✅ Yes (in Employees) |
| **Cash Advance** | Stored Amount | ❌ No | ✅ Yes (in Payroll) |
| **Incentive** | Stored Amount | ❌ No | ✅ Yes (in Payroll) |

---

## Key Points

✅ **Basic Salary** = Daily Rate (not monthly!)
✅ **Salary** = Basic Salary × Work Days
✅ **SSS**: Monthly = 7.5%, Weekly = Monthly ÷ 4
✅ **PhilHealth**: Use stored amount (no calculation)
✅ **Pag-IBIG**: Use stored amount (no calculation)
✅ **Cash Advance**: Use stored amount, editable in Payroll page
✅ **Incentive**: Full amount always, editable in Payroll page

❌ **DO NOT** divide Basic Salary by 30
❌ **DO NOT** prorate PhilHealth, Pag-IBIG, Cash Advance, or Incentive
❌ **DO NOT** calculate PhilHealth or Pag-IBIG automatically

---

## How to Set Up Employee

When adding an employee:

1. **Basic Salary**: Enter the DAILY RATE (e.g., ₱1,000/day)
2. **SSS Salary**: Enter the monthly salary for SSS calculation (e.g., ₱30,000)
3. **PhilHealth**: Enter the monthly contribution amount (e.g., ₱600)
4. **Pag-IBIG**: Enter the monthly contribution amount (e.g., ₱200)

Example:
- If employee earns ₱30,000/month for 30 days
- Basic Salary = ₱30,000 ÷ 30 = ₱1,000/day
- SSS Salary = ₱30,000 (for 7.5% calculation)

---

## Files Modified

- ✅ `src/pages/Payroll.jsx` - Updated salary calculation to multiply (not divide)

## Status: CORRECT ✅

Salary calculation now correctly multiplies Basic Salary by Work Days!
