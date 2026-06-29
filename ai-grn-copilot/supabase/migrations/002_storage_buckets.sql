-- =============================================
-- Storage Buckets Setup
-- Run this in Supabase SQL editor AFTER the main migration
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'invoice-files',
    'invoice-files',
    true,
    20971520,  -- 20MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'template-files',
    'template-files',
    true,
    15728640,  -- 15MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  ),
  (
    'grn-pdfs',
    'grn-pdfs',
    false,
    10485760,  -- 10MB
    ARRAY['application/pdf']
  ),
  (
    'company-logos',
    'company-logos',
    true,
    2097152,   -- 2MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- Storage policies for invoice-files
CREATE POLICY "invoice_files_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'invoice-files');

CREATE POLICY "invoice_files_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoice-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "invoice_files_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'invoice-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for template-files
CREATE POLICY "template_files_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'template-files');

CREATE POLICY "template_files_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'template-files' AND
    auth.role() = 'authenticated'
  );

-- Storage policies for grn-pdfs
CREATE POLICY "grn_pdfs_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'grn-pdfs' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "grn_pdfs_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'grn-pdfs' AND
    auth.role() = 'authenticated'
  );

-- Storage policies for company-logos
CREATE POLICY "company_logos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "company_logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-logos' AND
    auth.role() = 'authenticated'
  );
