-- Storage policies for client-side upload via anon key
-- Run in: Supabase Dashboard → SQL Editor
--
-- Context: the app uses NextAuth (not Supabase Auth), so all browser requests
-- arrive with the anon role. These policies allow the anon role to INSERT
-- (upload) into specific buckets while leaving SELECT/UPDATE/DELETE restricted.
--
-- Security note: the anon key is public (NEXT_PUBLIC_). Anyone who knows it
-- can upload to these buckets. For an internal ERP this is acceptable because:
-- 1. The app UI is protected by NextAuth — only authenticated users reach
--    the upload components
-- 2. Product images are public-readable anyway
-- 3. Payment proofs are stored at unpredictable paths (timestamp + random)

-- ── products bucket ──────────────────────────────────────────────────────────

CREATE POLICY "anon can upload to products"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'products');

-- ── financeiro bucket ────────────────────────────────────────────────────────

CREATE POLICY "anon can upload to financeiro"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'financeiro');

-- ── verify (run after creating policies) ─────────────────────────────────────

SELECT policyname, tablename, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
