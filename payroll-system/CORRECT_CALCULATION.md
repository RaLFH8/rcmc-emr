# Payroll Calculation - CORRECT FORMULA ✅

## Salary Calculation

### Formula
```
Daily Rate = Basic Salary ÷ 30
Salary = Daily Rate × Work Days
```

### Monthly Payroll
- Work Days = 30 (full month)
- Salary = (Basic Salary ÷ 30) × 30 = Basic Salary

### Weekly Payroll
- Work Days = Number of days between Start Date and End Date
- Salary = (Basic Salary ÷ 30) × Work Days

### Examples

**Example 1: 7 Days (Mon-Sun)**
- Basic Salary: ₱30,000
- Work Days: 7
- Daily Rate: ₱30,000 ÷ 30 = ₱1,000
- Salary: ₱1,000 × 7 = ₱7,000

**Example 2: 3 Days (Mon-Wed)**
- Basic Salary: ₱30,000
- Work Days: 3
- Daily Rate: ₱30,000 ÷ 30 = ₱1,000
- Salary: ₱1,000 × 3 = ₱3,000

**Example 3: Full Month**
- Basic Salary: ₱30,000
- Work Days: 30
- Daily Rate: ₱30,000 ÷ 30 = ₱1,000
- Salary: ₱1,000 × 30 = ₱30,000

---

## SSS Contribution

### Formula
```
Monthly SSS = SSS Salary × 7.5%
Weekly SSS = Monthly SSS ÷ 4
```

### Monthly Payroll
- SSS = SSS Salary × 7.5%

### Weekly Payroll
- SSS = (SSS Salary × 7.5%) ÷ 4

### Examples

**Monthly SSS:**
- SSS Salary: ₱30,000
- SSS = ₱30,000 × 7.5% = ₱2,250

**Weekly SSS:**
- SSS Salary: ₱30,000
- Monthly SSS: ₱30,000 × 7.5% = ₱2,250
- Weekly SSS: ₱2,250 ÷ 4 = ₱562.50

---

## PhilHealth Contribution

### Formula
```
PhilHealth = Manually Input Amount (stored in employee record)
```

- NOT prorated
- NOT calculated automatically
- Use the exact amount stored in the employee's PhilHealth field

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

- NOT prorated
- NOT calculated automatically
- Use the exact amount stored in the employee's Pag-IBIG field

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
- Basic Salary: ₱30,000/month
- SSS Salary: ₱30,000
- PhilHealth: ₱600 (manually set)
- Pag-IBIG: ₱200 (manually set)
- Cash Advance: ₱3,000 (manually set)
- Incentive: ₱1,000 (manually set)

---

### Scenario 1: Monthly Payroll (30 days)

**Earnings:**
- Salary: (₱30,000 ÷ 30) × 30 = ₱30,000
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
- Salary: (₱30,000 ÷ 30) × 7 = ₱7,000
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

### Scenario 3: Weekly Payroll (3 days)

**Earnings:**
- Salary: (₱30,000 ÷ 30) × 3 = ₱3,000
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

## Summary of Rules

| Item | Monthly | Weekly | Prorated? | Editable? |
|------|---------|--------|-----------|-----------|
| **Salary** | Daily Rate × 30 | Daily Rate × Work Days | ✅ Yes | ❌ No |
| **SSS** | SSS Salary × 7.5% | Monthly SSS ÷ 4 | ❌ No | ❌ No |
| **PhilHealth** | Stored Amount | Stored Amount | ❌ No | ✅ Yes (in Employees) |
| **Pag-IBIG** | Stored Amount | Stored Amount | ❌ No | ✅ Yes (in Employees) |
| **Cash Advance** | Stored Amount | Stored Amount | ❌ No | ✅ Yes (in Payroll) |
| **Incentive** | Stored Amount | Stored Amount | ❌ No | ✅ Yes (in Payroll) |

---

## Key Points

✅ **Salary**: Always calculated based on work days
✅ **SSS**: Monthly = 7.5%, Weekly = Monthly ÷ 4
✅ **PhilHealth**: Use stored amount (no calculation)
✅ **Pag-IBIG**: Use stored amount (no calculation)
✅ **Cash Advance**: Use stored amount, editable in Payroll page
✅ **Incentive**: Full amount always, editable in Payroll page

❌ **DO NOT** prorate PhilHealth, Pag-IBIG, Cash Advance, or Incentive
❌ **DO NOT** calculate PhilHealth or Pag-IBIG automatically

---

## Files Modified

- ✅ `src/pages/Payroll.jsx` - Updated all calculation functions

## Status: CORRECT ✅

All calculations now follow the correct formula!
