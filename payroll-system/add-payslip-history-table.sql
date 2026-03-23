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

