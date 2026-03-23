-- =====================================================
-- MULTI-TENANCY MIGRATION
-- Run this in Supabase SQL Editor to enable SaaS
-- =====================================================

-- Step 1: Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#14b8a6',
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  subscription_plan TEXT DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'basic', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  max_users INTEGER DEFAULT 5,
  max_patients INTEGER DEFAULT 100,
  features JSONB DEFAULT '{"appointments": true, "billing": true, "prescriptions": true, "reports": false, "analytics": false}',
  settings JSONB DEFAULT '{"timezone": "Asia/Manila", "currency": "PHP", "date_format": "MM/DD/YYYY"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON public.tenants(subscription_plan);

-- Step 2: Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);

-- Step 3: Add tenant_id to existing tables
ALTER TABLE emr.patients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.doctors ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.appointments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.consultations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.billing ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.inventory ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.prescriptions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.rooms ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.services ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.inpatients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE emr.user_profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Step 4: Create indexes for tenant_id
CREATE INDEX IF NOT EXISTS idx_patients_tenant ON emr.patients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doctors_tenant ON emr.doctors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON emr.appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consultations_tenant ON emr.consultations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_tenant ON emr.billing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tenant ON emr.inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant ON emr.prescriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rooms_tenant ON emr.rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON emr.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inpatients_tenant ON emr.inpatients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON emr.user_profiles(tenant_id);

-- Step 5: Create function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM emr.user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 6: Update RLS policies for multi-tenancy
-- Drop existing policies
DROP POLICY IF EXISTS "All authenticated users can read patients" ON emr.patients;
DROP POLICY IF EXISTS "Receptionists and admins can insert patients" ON emr.patients;
DROP POLICY IF EXISTS "Receptionists and admins can update patients" ON emr.patients;

-- Create new tenant-aware policies for patients
CREATE POLICY "Users can only see their tenant's patients"
  ON emr.patients FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can only insert patients for their tenant"
  ON emr.patients FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

CREATE POLICY "Users can only update their tenant's patients"
  ON emr.patients FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Update policies for doctors
DROP POLICY IF EXISTS "All authenticated users can read doctors" ON emr.doctors;

CREATE POLICY "Users can only see their tenant's doctors"
  ON emr.doctors FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Admins can manage their tenant's doctors"
  ON emr.doctors FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Update policies for appointments
DROP POLICY IF EXISTS "All authenticated users can read appointments" ON emr.appointments;
DROP POLICY IF EXISTS "Receptionists and admins can manage appointments" ON emr.appointments;

CREATE POLICY "Users can only see their tenant's appointments"
  ON emr.appointments FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can manage their tenant's appointments"
  ON emr.appointments FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Update policies for consultations
DROP POLICY IF EXISTS "Doctors can read their own consultations" ON emr.consultations;
DROP POLICY IF EXISTS "Doctors can insert consultations" ON emr.consultations;

CREATE POLICY "Users can see their tenant's consultations"
  ON emr.consultations FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles up
      WHERE up.id = auth.uid() 
      AND (up.role = 'admin' OR (up.role = 'doctor' AND up.doctor_id = emr.consultations.doctor_id))
    )
  );

CREATE POLICY "Doctors can insert consultations for their tenant"
  ON emr.consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'doctor')
    )
  );

-- Update policies for billing
DROP POLICY IF EXISTS "All authenticated users can read billing" ON emr.billing;
DROP POLICY IF EXISTS "Receptionists and admins can manage billing" ON emr.billing;

CREATE POLICY "Users can see their tenant's billing"
  ON emr.billing FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can manage their tenant's billing"
  ON emr.billing FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Update policies for inventory
DROP POLICY IF EXISTS "All authenticated users can read inventory" ON emr.inventory;
DROP POLICY IF EXISTS "Receptionists and admins can manage inventory" ON emr.inventory;

CREATE POLICY "Users can see their tenant's inventory"
  ON emr.inventory FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can manage their tenant's inventory"
  ON emr.inventory FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (
    tenant_id = public.get_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'receptionist')
    )
  );

-- Step 7: Create audit log table with tenant context
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);

-- Enable RLS on new tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenants table
CREATE POLICY "Users can see their own tenant"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = public.get_user_tenant_id());

CREATE POLICY "Admins can update their tenant"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (id = public.get_user_tenant_id())
  WITH CHECK (
    id = public.get_user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM emr.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for subscriptions
CREATE POLICY "Users can see their tenant's subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- RLS policies for audit logs
CREATE POLICY "Users can see their tenant's audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Step 8: Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Step 9: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

-- Step 10: Create sample tenant for testing (OPTIONAL - Remove in production)
-- INSERT INTO public.tenants (name, subdomain, contact_email, subscription_plan)
-- VALUES ('Demo Clinic', 'demo', 'demo@example.com', 'trial');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Update your application code to include tenant_id in all queries
-- 2. Implement tenant signup flow
-- 3. Add subdomain routing
-- 4. Test with multiple test tenants
-- =====================================================
