# Setup Payslip History - Quick Steps

## Step 1: Run SQL in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor**
4. Click **New Query**
5. Copy and paste this SQL:

```sql
-- Create payslip_history table to track all generated payslips
CREATE TABLE IF NOT EXISTS payslip_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'weekly')),
  period_label TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  work_days INTEGER,
  basic_salary NUMERIC NOT NULL,
  incentive NUMERIC DEFAULT 0,
  sss_deduction NUMERIC DEFAULT 0,
  philhealth_deduction NUMERIC DEFAULT 0,
  pagibig_deduction NUMERIC DEFAULT 0,
  cash_advance NUMERIC DEFAULT 0,
  total_deductions NUMERIC NOT NULL,
  net_pay NUMERIC NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payslip_history_employee_id ON payslip_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslip_history_period_type ON payslip_history(period_type);
CREATE INDEX IF NOT EXISTS idx_payslip_history_generated_at ON payslip_history(generated_at DESC);

-- Enable Row Level Security
ALTER TABLE payslip_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Enable all operations for payslip_history" ON payslip_history
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON payslip_history TO anon, authenticated;
```

6. Click **RUN**
7. You should see "Success. No rows returned"

## Step 2: Restart Server

```cmd
cd C:\Users\ralfh\Desktop\Kiro\payroll-system
npm run dev
```

## Step 3: Test

1. Open http://localhost:5173
2. Go to **Payroll** page
3. Click any employee to preview payslip
4. Click **Download PDF**
5. Go to **Payslip History** (new menu item)
6. You should see the payslip record!

## Step 4: Push to GitHub (After Testing)

```cmd
cd C:\Users\ralfh\Desktop\Kiro\payroll-system
git add .
git commit -m "Add payslip history tracking feature"
git push origin main
```

## What You Get

- ✅ Automatic payslip tracking
- ✅ History page with filters
- ✅ Statistics dashboard
- ✅ Complete audit trail
- ✅ Delete functionality

Done!

