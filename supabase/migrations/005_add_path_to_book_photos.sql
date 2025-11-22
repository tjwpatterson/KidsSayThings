-- Add path column to book_photos table
-- This column stores the storage path for photos uploaded via signed URLs
ALTER TABLE book_photos ADD COLUMN IF NOT EXISTS path text;

