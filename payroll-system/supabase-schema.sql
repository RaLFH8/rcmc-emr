-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  salary NUMERIC NOT NULL,
  status TEXT DEFAULT 'Active',
  join_date DATE NOT NULL,
  sss_number TEXT,
  sss_salary NUMERIC DEFAULT 0,
  sss NUMERIC DEFAULT 0,
  philhealth NUMERIC DEFAULT 0,
  pagibig NUMERIC DEFAULT 0,
  cash_advance NUMERIC DEFAULT 0,
  incentive NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payroll_records table
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  basic_salary NUMERIC NOT NULL,
  sss NUMERIC DEFAULT 0,
  philhealth NUMERIC DEFAULT 0,
  pagibig NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending',
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_records(period);

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - adjust based on your auth needs)
CREATE POLICY "Enable all operations for employees" ON employees
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for payroll_records" ON payroll_records
  FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employees
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
