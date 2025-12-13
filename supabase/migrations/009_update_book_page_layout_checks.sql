-- Align book_pages layout constraints with the actual layout ids used in the app.
-- The original schema only allowed values ('A', 'B', 'C'), which caused every spread
-- save to fail once we introduced the newer layout catalog (e.g. "photo-1-full-bleed").

ALTER TABLE book_pages
  DROP CONSTRAINT IF EXISTS book_pages_left_layout_check;

ALTER TABLE book_pages
  ADD CONSTRAINT book_pages_left_layout_check CHECK (
    left_layout IS NULL OR left_layout IN (
      'cover-wrap-photo',
      'cover-photo-band',
      'cover-mosaic',
      'photo-1-full-bleed',
      'photo-1-wide-border',
      'photo-1-upper-two-thirds',
      'photo-1-small-centered',
      'photo-2-stack',
      'photo-2-columns',
      'photo-2-emphasis',
      'photo-3-stack',
      'photo-3-large-top',
      'photo-4-grid',
      'photo-4-hero-grid'
    )
  );

ALTER TABLE book_pages
  DROP CONSTRAINT IF EXISTS book_pages_right_layout_check;

ALTER TABLE book_pages
  ADD CONSTRAINT book_pages_right_layout_check CHECK (
    right_layout IS NULL OR right_layout IN (
      'cover-wrap-photo',
      'cover-photo-band',
      'cover-mosaic',
      'quote-1-centered',
      'quote-2-stack',
      'quote-3-stack'
    )
  );
