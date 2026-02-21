-- RCMC Healthcare EMR Database Schema
-- Run this in your Supabase SQL Editor

-- Create EMR schema
CREATE SCHEMA IF NOT EXISTS emr;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER PROFILES TABLE (for role management)
-- =====================================================
CREATE TABLE emr.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
  doctor_id UUID REFERENCES emr.doctors(id),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_role ON emr.user_profiles(role);
CREATE INDEX idx_user_profiles_status ON emr.user_profiles(status);

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE emr.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  contact_number TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_number TEXT NOT NULL,
  blood_type TEXT,
  allergies TEXT[],
  medical_history TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster searches
CREATE INDEX idx_patients_name ON emr.patients(last_name, first_name);
CREATE INDEX idx_patients_number ON emr.patients(patient_number);
CREATE INDEX idx_patients_contact ON emr.patients(contact_number);
CREATE INDEX idx_patients_status ON emr.patients(status);

-- =====================================================
-- DOCTORS TABLE
-- =====================================================
CREATE TABLE emr.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_doctors_status ON emr.doctors(status);

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE emr.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES emr.doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show')),
  appointment_type TEXT DEFAULT 'Consultation' CHECK (appointment_type IN ('Consultation', 'Follow-up', 'Emergency', 'Check-up')),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_appointments_date ON emr.appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON emr.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON emr.appointments(doctor_id);
CREATE INDEX idx_appointments_status ON emr.appointments(status);

-- =====================================================
-- CONSULTATIONS TABLE
-- =====================================================
CREATE TABLE emr.consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES emr.doctors(id),
  appointment_id UUID REFERENCES emr.appointments(id),
  consultation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  chief_complaint TEXT NOT NULL,
  vital_signs JSONB DEFAULT '{}',
  diagnosis TEXT NOT NULL,
  prescription TEXT,
  lab_orders TEXT[],
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_consultations_patient ON emr.consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON emr.consultations(doctor_id);
CREATE INDEX idx_consultations_date ON emr.consultations(consultation_date);

-- =====================================================
-- BILLING TABLE
-- =====================================================
CREATE TABLE emr.billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES emr.patients(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES emr.consultations(id),
  bill_date DATE DEFAULT CURRENT_DATE,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  balance NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_billing_patient ON emr.billing(patient_id);
CREATE INDEX idx_billing_status ON emr.billing(payment_status);
CREATE INDEX idx_billing_date ON emr.billing(bill_date);

-- =====================================================
-- INVENTORY TABLE (for clinic supplies)
-- =====================================================
CREATE TABLE emr.inventory (
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

CREATE INDEX idx_inventory_category ON emr.inventory(category);
CREATE INDEX idx_inventory_status ON emr.inventory(status);
CREATE INDEX idx_inventory_code ON emr.inventory(item_code);

-- =====================================================
-- VITAL SIGNS TABLE (separate from consultations)
-- =====================================================
CREATE TABLE emr.vital_signs (
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

CREATE INDEX idx_vital_signs_patient ON emr.vital_signs(patient_id);
CREATE INDEX idx_vital_signs_date ON emr.vital_signs(recorded_at);

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
CREATE TABLE emr.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table ON emr.audit_log(table_name);
CREATE INDEX idx_audit_log_record ON emr.audit_log(record_id);
CREATE INDEX idx_audit_log_user ON emr.audit_log(user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate patient number
CREATE OR REPLACE FUNCTION emr.generate_patient_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM emr.patients;
  new_number := 'P' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION emr.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for patients updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON emr.patients
  FOR EACH ROW
  EXECUTE FUNCTION emr.update_updated_at_column();

-- Trigger for appointments updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON emr.appointments
  FOR EACH ROW
  EXECUTE FUNCTION emr.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE emr.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emr.audit_log ENABLE ROW LEVEL SECURITY;

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

-- Doctors Policies (all can read)
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
-- SAMPLE DATA
-- =====================================================

-- Insert sample doctors
INSERT INTO emr.doctors (first_name, last_name, specialization, license_number, contact_number, email) VALUES
('Ashlynn', 'Kenter', 'General Practitioner', 'MD-001234', '0938-775-1504', 'dr.kenter@rcmc.com'),
('Charlie', 'Gouse', 'Pediatrician', 'MD-001235', '0976-273-9445', 'dr.gouse@rcmc.com'),
('Justin', 'Bergson', 'Cardiologist', 'MD-001236', '0917-123-4567', 'dr.bergson@rcmc.com'),
('Madelyn', 'Geldt', 'Dermatologist', 'MD-001237', '0918-234-5678', 'dr.geldt@rcmc.com');

-- Insert sample patients
INSERT INTO emr.patients (patient_number, first_name, last_name, date_of_birth, gender, contact_number, address, emergency_contact_name, emergency_contact_number, blood_type) VALUES
('P000001', 'Rodriguez', 'Santos', '1967-01-15', 'Female', '021 87891234', '321 Birch St., Pililla, Rizal', 'Maria Santos', '021 87891235', 'O+'),
('P000002', 'Marcus', 'Stanton', '1983-02-18', 'Male', '021 45678901', '854 Cedar Ave., Pililla, Rizal', 'Jane Stanton', '021 45678902', 'A+'),
('P000003', 'Madelyn', 'Schleifer', '1998-03-26', 'Female', '021 98765432', '987 Willow Dr., Pililla, Rizal', 'John Schleifer', '021 98765433', 'B+'),
('P000004', 'Talan', 'Schleifer', '1995-02-14', 'Male', '021 78745412', '765 Pine Rd., Pililla, Rizal', 'Sarah Schleifer', '021 78745413', 'AB+');

-- Insert sample inventory items
INSERT INTO emr.inventory (item_name, item_code, category, quantity, unit, unit_price, reorder_level, supplier) VALUES
('Paracetamol 500mg', 'MED-001', 'Medicine', 500, 'tablets', 2.50, 100, 'PharmaCorp'),
('Amoxicillin 500mg', 'MED-002', 'Medicine', 300, 'capsules', 5.00, 50, 'PharmaCorp'),
('Surgical Gloves', 'SUP-001', 'Supplies', 1000, 'pairs', 15.00, 200, 'MedSupply Inc'),
('Syringes 5ml', 'SUP-002', 'Supplies', 500, 'pieces', 3.00, 100, 'MedSupply Inc'),
('Blood Pressure Monitor', 'EQP-001', 'Equipment', 5, 'units', 2500.00, 2, 'MedTech Solutions'),
('Thermometer Digital', 'EQP-002', 'Equipment', 20, 'units', 350.00, 5, 'MedTech Solutions');

-- Note: User profiles will be created automatically when users sign up through Supabase Auth
-- For testing, you can manually create user profiles after creating auth users

-- Grant permissions
GRANT USAGE ON SCHEMA emr TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA emr TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA emr TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA emr TO authenticated;
