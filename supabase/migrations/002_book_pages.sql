-- Add design_mode to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS design_mode text CHECK (design_mode IN ('auto', 'manual'));

-- Book pages table - stores individual page layouts and content
CREATE TABLE book_pages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  left_layout text CHECK (left_layout IN ('A', 'B', 'C')),
  right_layout text CHECK (right_layout IN ('A', 'B', 'C')),
  left_content jsonb DEFAULT '[]'::jsonb,
  right_content jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(book_id, page_number)
);

CREATE INDEX idx_book_pages_book_id ON book_pages(book_id);
CREATE INDEX idx_book_pages_page_number ON book_pages(book_id, page_number);

-- Book photos table - stores photos uploaded specifically for a book
CREATE TABLE book_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  attachment_id uuid REFERENCES attachments(id) ON DELETE SET NULL,
  url text NOT NULL,
  width int,
  height int,
  filename text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_book_photos_book_id ON book_photos(book_id);
CREATE INDEX idx_book_photos_attachment_id ON book_photos(attachment_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_book_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_book_pages_updated_at
  BEFORE UPDATE ON book_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_book_pages_updated_at();

-- RLS Policies for book_pages
ALTER TABLE book_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pages of their household's books"
  ON book_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      JOIN household_members ON books.household_id = household_members.household_id
      WHERE book_pages.book_id = books.id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create pages for their household's books"
  ON book_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books
      JOIN household_members ON books.household_id = household_members.household_id
      WHERE book_pages.book_id = books.id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages of their household's books"
  ON book_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM books
      JOIN household_members ON books.household_id = household_members.household_id
      WHERE book_pages.book_id = books.id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pages of their household's books"
  ON book_pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM books
      JOIN household_members ON books.household_id = household_members.household_id
      WHERE book_pages.book_id = books.id
        AND household_members.user_id = auth.uid()
    )
  );

-- RLS Policies for book_photos
ALTER TABLE book_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos of their household's books"
  ON book_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      JOIN household_members ON books.household_id = household_members.household_id
      WHERE book_photos.book_id = books.id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create photos for their household's books"
  ON book_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books
      JOIN household_members ON books.household_id = household_members.household_id
      WHERE book_photos.book_id = books.id
        AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of their household's books"
  ON book_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM books
      JOIN household_members ON books.household_id = household_members.household_id
      WHERE book_photos.book_id = books.id
        AND household_members.user_id = auth.uid()
    )
  );

