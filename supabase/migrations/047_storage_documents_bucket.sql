-- ============================================================================
-- 047: Documents storage bucket + authenticated upload/download policies
-- ============================================================================
-- CRM file attachments were uploaded from the browser with the anon key.
-- Without storage.objects policies the upload fails for every role.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', true, 20971520)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = COALESCE(storage.buckets.file_size_limit, 20971520);

DROP POLICY IF EXISTS "documents_auth_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_auth_delete" ON storage.objects;

CREATE POLICY "documents_auth_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "documents_auth_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_auth_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_auth_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents');
