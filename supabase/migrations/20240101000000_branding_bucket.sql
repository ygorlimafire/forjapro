-- Branding bucket for company logos and brand assets
-- Run once in Supabase SQL Editor (Settings → SQL Editor → New query)

-- 1. Create bucket (public = true so logo URLs are readable without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  2097152,                                            -- 2 MB hard limit
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public            = EXCLUDED.public,
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Public SELECT: anyone can read logo URLs (needed to render logos in the app)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'branding_public_select'
  ) THEN
    CREATE POLICY "branding_public_select"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'branding');
  END IF;
END $$;

-- 3. No direct INSERT/UPDATE/DELETE policies are created.
--    All writes go through /api/upload which uses the service-role key.
--    The service-role key bypasses RLS entirely, so writes are server-controlled.
--    Direct client uploads are therefore impossible (no matching policy = deny).
