-- Allow arbitrary layout identifiers to be stored on book pages.
-- The previous CHECK constraints limited layouts to a small hard-coded set ("A", "B", "C"),
-- which caused spread saves to fail when users selected the newer layout ids.
ALTER TABLE book_pages DROP CONSTRAINT IF EXISTS book_pages_left_layout_check;
ALTER TABLE book_pages DROP CONSTRAINT IF EXISTS book_pages_right_layout_check;
