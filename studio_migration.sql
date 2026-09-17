-- ═══════════════════════════════════════════════════════════════════
-- SK ONLINE — Studio Archive Workspace Migration
-- Run this script in Supabase SQL Editor once.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Create the studio_records table
CREATE TABLE IF NOT EXISTS public.studio_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  customer_name text NOT NULL,
  mobile        text,
  address       text,
  category      text NOT NULL DEFAULT 'Other',
  file_url      text NOT NULL,
  file_name     text NOT NULL,
  file_size_kb  numeric DEFAULT 0,
  file_type     text
);

-- 2. Enable Row Level Security
ALTER TABLE public.studio_records ENABLE ROW LEVEL SECURITY;

-- 3. Allow all operations (operator-only app, no public-facing auth)
DROP POLICY IF EXISTS "studio_all" ON public.studio_records;
CREATE POLICY "studio_all"
  ON public.studio_records
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKET SETUP
-- Run these manually in Supabase Dashboard → Storage → New Bucket:
--   Bucket name: studio-files
--   Public bucket: YES (so public URLs work for Print/View)
--
-- Or run via the Supabase client API (service_role key required):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('studio-files', 'studio-files', true)
-- ON CONFLICT (id) DO NOTHING;
-- ═══════════════════════════════════════════════════════════════════

-- 4. Storage RLS: Allow public upload and read for studio-files bucket
-- (Apply in Supabase Dashboard → Storage → studio-files → Policies)
-- Policy: Allow all for now (operator-only use case)
-- CREATE POLICY "studio_files_all"
--   ON storage.objects
--   FOR ALL
--   USING (bucket_id = 'studio-files')
--   WITH CHECK (bucket_id = 'studio-files');
