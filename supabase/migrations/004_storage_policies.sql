-- Storage bucket policies for attachments bucket
-- These policies control access to files in Supabase Storage

-- Policy to allow authenticated users to upload files to books/{book_id}/photos/
CREATE POLICY "Authenticated users can upload book photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'books' AND
  (storage.foldername(name))[3] = 'photos'
);

-- Policy to allow authenticated users to read files they have access to
-- Users can read files from books they have access to (household members)
CREATE POLICY "Authenticated users can read book photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'books' AND
  (storage.foldername(name))[3] = 'photos'
);

-- Policy to allow authenticated users to update files they have access to
CREATE POLICY "Authenticated users can update book photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'books' AND
  (storage.foldername(name))[3] = 'photos'
)
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'books' AND
  (storage.foldername(name))[3] = 'photos'
);

-- Policy to allow authenticated users to delete files they have access to
CREATE POLICY "Authenticated users can delete book photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'books' AND
  (storage.foldername(name))[3] = 'photos'
);

-- Also allow access to entry attachments (for backwards compatibility)
CREATE POLICY "Authenticated users can upload entry attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'entries'
);

CREATE POLICY "Authenticated users can read entry attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'entries'
);

CREATE POLICY "Authenticated users can update entry attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'entries'
)
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'entries'
);

CREATE POLICY "Authenticated users can delete entry attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = 'entries'
);

