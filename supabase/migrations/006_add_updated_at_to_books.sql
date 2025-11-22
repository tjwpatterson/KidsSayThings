-- Add updated_at column to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- Create trigger to update updated_at when book_pages are modified
CREATE OR REPLACE FUNCTION update_books_updated_at_from_pages()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE books
  SET updated_at = now()
  WHERE id = NEW.book_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update books.updated_at when book_pages are updated
DROP TRIGGER IF EXISTS update_books_updated_at_on_page_change ON book_pages;
CREATE TRIGGER update_books_updated_at_on_page_change
  AFTER INSERT OR UPDATE OR DELETE ON book_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_books_updated_at_from_pages();

-- Also update when book_photos are added/removed
DROP TRIGGER IF EXISTS update_books_updated_at_on_photo_change ON book_photos;
CREATE TRIGGER update_books_updated_at_on_photo_change
  AFTER INSERT OR UPDATE OR DELETE ON book_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_books_updated_at_from_pages();

-- Also update when book properties are changed directly
CREATE OR REPLACE FUNCTION update_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_books_updated_at_trigger ON books;
CREATE TRIGGER update_books_updated_at_trigger
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_books_updated_at();

