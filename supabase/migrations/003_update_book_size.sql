-- Update book size constraint to remove 8x10 and add digital
ALTER TABLE books DROP CONSTRAINT IF EXISTS books_size_check;
ALTER TABLE books ADD CONSTRAINT books_size_check CHECK (size IN ('6x9', 'digital'));

-- Update any existing 8x10 books to 6x9
UPDATE books SET size = '6x9' WHERE size = '8x10';

