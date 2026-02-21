-- =====================================================
-- UPDATE EXISTING SCHEMA - ADD MULTI-ROLE SUPPORT
-- =====================================================
-- Run this to add user management without recreating existing tables

-- =====================================================
-- 1. CREATE USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
  doctor_id UUID REFERENCES emr.doctors(id),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON emr.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON emr.user_profiles(status);

-- =====================================================
-- 2. CREATE INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name TEXT NOT NULL,
  item_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Medicine', 'Supplies', 'Equipment', 'Other')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  supplier TEXT,
  expiry_date DATE,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Low Stock', 'Out of Stock', 'Expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON emr.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON emr.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_code ON emr.inventory(item_code);

-- =====================================================
-- 3. CREATE VITAL SIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emr.vital_signs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  temperature NUMERIC(4,1),
  respiratory_rate INTEGER,
  oxygen_saturation INTEGER,
  weight NUMERIC(5,2),
  height NUMERIC(5,2),
  bmi NUMERIC(4,2),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vital_signs_patient ON emr.vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_date ON emr.vital_signs(recorded_at);

-- =====================================================
-- 4. ENABLE RLS ON NEW TABLES
-- =====================================================
ALTER TABLE emr.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.vital_signs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. DROP OLD POLICIES (if they exist)
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated users to read patients" ON emr.patients;
DROP POLICY IF EXISTS "Allow authenticated users to insert patients" ON emr.patients;
DROP POLICY IF EXISTS "Allow authenticated users to update patients" ON emr.patients;
DROP POLICY IF EXISTS "Allow authenticated users to read doctors" ON emr.doctors;
DROP POLICY IF EXISTS "Allow authenticated users to read appointments" ON emr.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to insert appointments" ON emr.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to update appointments" ON emr.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to read consultations" ON emr.consultations;
DROP POLICY IF EXISTS "Allow authenticated users to insert consultations" ON emr.consultations;
DROP POLICY IF EXISTS "Allow authenticated users to read billing" ON emr.billing;
DROP POLICY IF EXISTS "Allow authenticated users to insert billing" ON emr.billing;
DROP POLICY IF EXISTS "Allow authenticated users to update billing" ON emr.billing;

-- =====================================================
-- 6. CREATE NEW ROLE-BASED POLICIES
-- =====================================================

-- User Profiles Policies
CREATE POLICY "Users can read their own profile"
  ON emr.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON emr.user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage profiles"
  ON emr.user_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Patients Policies
CREATE POLICY "All authenticated users can read patients"
  ON emr.patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Receptionists and admins can insert patients"
  ON emr.patients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "Receptionists and admins can update patients"
  ON emr.patients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Doctors Policies
CREATE POLICY "All authenticated users can read doctors"
  ON emr.doctors FOR SELECT
  TO authenticated
  USING (true);

-- Appointments Policies
CREATE POLICY "All authenticated users can read appointments"
  ON emr.appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Receptionists and admins can manage appointments"
  ON emr.appointments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Consultations Policies
CREATE POLICY "Doctors can read their own consultations"
  ON emr.consultations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles up
      WHERE up.id = auth.uid() 
      AND (up.role = 'admin' OR (up.role = 'doctor' AND up.doctor_id = emr.consultations.doctor_id))
    )
  );

CREATE POLICY "Doctors can insert consultations"
  ON emr.consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'doctor')
    )
  );

-- Billing Policies
CREATE POLICY "All authenticated users can read billing"
  ON emr.billing FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Receptionists and admins can manage billing"
  ON emr.billing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Inventory Policies
CREATE POLICY "All authenticated users can read inventory"
  ON emr.inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Receptionists and admins can manage inventory"
  ON emr.inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Vital Signs Policies
CREATE POLICY "All authenticated users can read vital signs"
  ON emr.vital_signs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Receptionists and doctors can insert vital signs"
  ON emr.vital_signs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'doctor', 'receptionist')
    )
  );

-- =====================================================
-- 7. INSERT SAMPLE INVENTORY DATA
-- =====================================================
INSERT INTO emr.inventory (item_name, item_code, category, quantity, unit, unit_price, reorder_level, supplier)
VALUES
  ('Paracetamol 500mg', 'MED-001', 'Medicine', 500, 'tablets', 2.50, 100, 'PharmaCorp'),
  ('Amoxicillin 500mg', 'MED-002', 'Medicine', 300, 'capsules', 5.00, 50, 'PharmaCorp'),
  ('Surgical Gloves', 'SUP-001', 'Supplies', 1000, 'pairs', 15.00, 200, 'MedSupply Inc'),
  ('Syringes 5ml', 'SUP-002', 'Supplies', 500, 'pieces', 3.00, 100, 'MedSupply Inc'),
  ('Blood Pressure Monitor', 'EQP-001', 'Equipment', 5, 'units', 2500.00, 2, 'MedTech Solutions'),
  ('Thermometer Digital', 'EQP-002', 'Equipment', 20, 'units', 350.00, 5, 'MedTech Solutions')
ON CONFLICT (item_code) DO NOTHING;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA emr TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA emr TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA emr TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA emr TO authenticated;

-- =====================================================
-- DONE! 
-- =====================================================
-- Next steps:
-- 1. Create admin user in Authentication → Users
-- 2. Run the create-test-users.sql to link the user profile
-- 3. Login and use the User Management panel to add doctors
