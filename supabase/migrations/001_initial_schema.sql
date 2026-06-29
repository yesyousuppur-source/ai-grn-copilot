-- =============================================
-- AI GRN Copilot - Database Schema
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'operator',
  company_id UUID,
  settings JSONB NOT NULL DEFAULT '{
    "theme": "system",
    "notifications_email": true,
    "notifications_push": true,
    "ocr_provider": "openai",
    "ai_provider": "openai"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COMPANIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{
    "auto_train": true,
    "confidence_threshold": 80,
    "duplicate_check": true,
    "auto_save": true,
    "gst_validation": true,
    "po_validation": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- COMPANY MEMBERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'operator',
  invited_by UUID NOT NULL REFERENCES public.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- =============================================
-- GRN TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS public.grn_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  file_url TEXT,
  thumbnail_url TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  table_config JSONB,
  page_count INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES public.users(id),
  ai_learning_data JSONB DEFAULT '{
    "training_count": 0,
    "accuracy_score": 0,
    "corrections": []
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- EXTRACTED INVOICES
-- =============================================
CREATE TABLE IF NOT EXISTS public.extracted_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  ocr_provider TEXT NOT NULL DEFAULT 'openai',
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_confidence FLOAT NOT NULL DEFAULT 0,
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- GRN RECORDS
-- =============================================
CREATE TABLE IF NOT EXISTS public.grn_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.grn_templates(id),
  invoice_id UUID REFERENCES public.extracted_invoices(id),
  grn_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  field_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validation_score FLOAT NOT NULL DEFAULT 0,
  invoice_file_url TEXT,
  grn_file_url TEXT,
  combined_pdf_url TEXT,
  ai_confidence FLOAT NOT NULL DEFAULT 0,
  ai_notes TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  UNIQUE(company_id, grn_number)
);

-- =============================================
-- AI TRAINING DATA
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.grn_templates(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  original_value TEXT NOT NULL,
  corrected_value TEXT NOT NULL,
  invoice_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  vendor_name TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ACTIVITY LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_grn_templates_company ON public.grn_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_extracted_invoices_company ON public.extracted_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_grn_records_company ON public.grn_records(company_id);
CREATE INDEX IF NOT EXISTS idx_grn_records_status ON public.grn_records(status);
CREATE INDEX IF NOT EXISTS idx_grn_records_created ON public.grn_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_training_company ON public.ai_training_data(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON public.activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);

-- Full text search on GRN records
CREATE INDEX IF NOT EXISTS idx_grn_records_grn_number ON public.grn_records USING gin(grn_number gin_trgm_ops);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grn_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "users_own_profile" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Company policies: members can access their company
CREATE POLICY "companies_member_access" ON public.companies
  FOR ALL USING (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT user_id FROM public.company_members WHERE company_id = id
    )
  );

-- Company members: company members can see each other
CREATE POLICY "company_members_access" ON public.company_members
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.company_members cm2 WHERE cm2.company_id = company_id
    ) OR
    auth.uid() IN (
      SELECT owner_id FROM public.companies c WHERE c.id = company_id
    )
  );

-- Templates: company members can access
CREATE POLICY "templates_company_access" ON public.grn_templates
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.company_members WHERE company_id = grn_templates.company_id
    ) OR
    auth.uid() IN (
      SELECT owner_id FROM public.companies WHERE id = grn_templates.company_id
    )
  );

-- Invoices: company members can access
CREATE POLICY "invoices_company_access" ON public.extracted_invoices
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.company_members WHERE company_id = extracted_invoices.company_id
    ) OR
    auth.uid() IN (
      SELECT owner_id FROM public.companies WHERE id = extracted_invoices.company_id
    )
  );

-- GRN records: company members can access
CREATE POLICY "grn_records_company_access" ON public.grn_records
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.company_members WHERE company_id = grn_records.company_id
    ) OR
    auth.uid() IN (
      SELECT owner_id FROM public.companies WHERE id = grn_records.company_id
    )
  );

-- AI training data: company members can access
CREATE POLICY "training_company_access" ON public.ai_training_data
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.company_members WHERE company_id = ai_training_data.company_id
    ) OR
    auth.uid() IN (
      SELECT owner_id FROM public.companies WHERE id = ai_training_data.company_id
    )
  );

-- Activity logs: company members can read, system can write
CREATE POLICY "activity_logs_company_access" ON public.activity_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.company_members WHERE company_id = activity_logs.company_id
    ) OR
    auth.uid() IN (
      SELECT owner_id FROM public.companies WHERE id = activity_logs.company_id
    )
  );

CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: users can only see their own
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER grn_templates_updated_at BEFORE UPDATE ON public.grn_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER grn_records_updated_at BEFORE UPDATE ON public.grn_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'owner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate GRN number function
CREATE OR REPLACE FUNCTION public.generate_grn_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.grn_records
  WHERE company_id = p_company_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  v_year := TO_CHAR(NOW(), 'YYYY');
  v_number := 'GRN-' || v_year || '-' || LPAD(v_count::TEXT, 5, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;
