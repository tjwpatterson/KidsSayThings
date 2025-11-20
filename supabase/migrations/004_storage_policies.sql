-- Storage bucket policies for attachments bucket
-- These policies control access to files in Supabase Storage

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files to attachments bucket
CREATE POLICY "Authenticated users can upload to attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Policy to allow authenticated users to read files from attachments bucket
CREATE POLICY "Authenticated users can read from attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');

-- Policy to allow authenticated users to update files in attachments bucket
CREATE POLICY "Authenticated users can update attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments')
WITH CHECK (bucket_id = 'attachments');

-- Policy to allow authenticated users to delete files from attachments bucket
CREATE POLICY "Authenticated users can delete from attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

