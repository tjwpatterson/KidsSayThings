-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to check if user is a member of a household
CREATE OR REPLACE FUNCTION is_member(household_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM household_members
    WHERE household_members.household_id = is_member.household_id
      AND household_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is owner or admin of a household
CREATE OR REPLACE FUNCTION is_owner_or_admin(household_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM household_members
    WHERE household_members.household_id = is_owner_or_admin.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Households table
CREATE TABLE households (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Household members table
CREATE TABLE household_members (
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (household_id, user_id)
);

-- Persons table
CREATE TABLE persons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  birthdate date,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_persons_household_id ON persons(household_id);

-- Entries table
CREATE TABLE entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  said_by uuid REFERENCES persons(id) ON DELETE SET NULL,
  captured_by uuid NOT NULL REFERENCES auth.users(id),
  text varchar(500) NOT NULL,
  entry_type text NOT NULL DEFAULT 'quote' CHECK (entry_type IN ('quote', 'note', 'milestone')),
  source text NOT NULL DEFAULT 'app' CHECK (source IN ('app', 'sms', 'import')),
  visibility text NOT NULL DEFAULT 'household' CHECK (visibility IN ('household', 'private')),
  entry_date date NOT NULL DEFAULT current_date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_entries_household_id_entry_date ON entries(household_id, entry_date DESC);
CREATE INDEX idx_entries_said_by ON entries(said_by);
CREATE INDEX idx_entries_captured_by ON entries(captured_by);

-- Entry tags table
CREATE TABLE entry_tags (
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag text NOT NULL,
  PRIMARY KEY (entry_id, tag)
);

CREATE INDEX idx_entry_tags_tag ON entry_tags(tag);
CREATE INDEX idx_entry_tags_entry_id ON entry_tags(entry_id);

-- Attachments table
CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('image', 'audio')),
  url text NOT NULL,
  width int,
  height int,
  duration_seconds int,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_attachments_entry_id ON attachments(entry_id);

-- Books table
CREATE TABLE books (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title text,
  date_start date NOT NULL,
  date_end date NOT NULL,
  size text NOT NULL DEFAULT '6x9' CHECK (size IN ('6x9', '8x10')),
  theme text NOT NULL DEFAULT 'classic' CHECK (theme IN ('classic', 'playful')),
  cover_style text NOT NULL DEFAULT 'linen' CHECK (cover_style IN ('linen', 'solid', 'gradient')),
  dedication text,
  created_at timestamptz DEFAULT now() NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'rendering', 'ready', 'error')),
  pdf_url text
);

CREATE INDEX idx_books_household_id ON books(household_id);

-- Book entries (snapshot of entries included in book)
CREATE TABLE book_entries (
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  position int NOT NULL,
  PRIMARY KEY (book_id, entry_id)
);

CREATE INDEX idx_book_entries_book_id ON book_entries(book_id);
CREATE INDEX idx_book_entries_entry_id ON book_entries(entry_id);

-- Reminders table
CREATE TABLE reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  frequency text NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  weekday int CHECK (weekday >= 0 AND weekday <= 6),
  hour int CHECK (hour >= 0 AND hour <= 23),
  tz text DEFAULT 'UTC',
  enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_reminders_household_id ON reminders(household_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);

-- Audit logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id uuid REFERENCES households(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_id uuid,
  meta jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_logs_household_id ON audit_logs(household_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Households policies
CREATE POLICY "Users can view their own households"
  ON households FOR SELECT
  USING (is_member(id));

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their households"
  ON households FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their households"
  ON households FOR DELETE
  USING (auth.uid() = owner_id);

-- Household members policies
CREATE POLICY "Members can view household members"
  ON household_members FOR SELECT
  USING (is_member(household_id));

CREATE POLICY "Owners and admins can add members"
  ON household_members FOR INSERT
  WITH CHECK (is_owner_or_admin(household_id));

CREATE POLICY "Owners and admins can update members"
  ON household_members FOR UPDATE
  USING (is_owner_or_admin(household_id));

CREATE POLICY "Owners and admins can remove members"
  ON household_members FOR DELETE
  USING (is_owner_or_admin(household_id));

-- Persons policies
CREATE POLICY "Members can view persons in their household"
  ON persons FOR SELECT
  USING (is_member(household_id));

CREATE POLICY "Members can create persons in their household"
  ON persons FOR INSERT
  WITH CHECK (is_member(household_id));

CREATE POLICY "Members can update persons in their household"
  ON persons FOR UPDATE
  USING (is_member(household_id));

CREATE POLICY "Members can delete persons in their household"
  ON persons FOR DELETE
  USING (is_member(household_id));

-- Entries policies
CREATE POLICY "Members can view household entries"
  ON entries FOR SELECT
  USING (
    is_member(household_id) AND (
      visibility = 'household' OR
      (visibility = 'private' AND captured_by = auth.uid())
    )
  );

CREATE POLICY "Members can create entries in their household"
  ON entries FOR INSERT
  WITH CHECK (
    is_member(household_id) AND
    captured_by = auth.uid()
  );

CREATE POLICY "Members can update their own entries or household entries"
  ON entries FOR UPDATE
  USING (
    is_member(household_id) AND (
      captured_by = auth.uid() OR
      visibility = 'household'
    )
  );

CREATE POLICY "Members can delete their own entries"
  ON entries FOR DELETE
  USING (
    is_member(household_id) AND
    captured_by = auth.uid()
  );

-- Entry tags policies
CREATE POLICY "Members can view entry tags in their household"
  ON entry_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
        AND is_member(entries.household_id)
    )
  );

CREATE POLICY "Members can manage entry tags in their household"
  ON entry_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
        AND is_member(entries.household_id)
    )
  );

-- Attachments policies
CREATE POLICY "Members can view attachments in their household"
  ON attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = attachments.entry_id
        AND is_member(entries.household_id)
    )
  );

CREATE POLICY "Members can manage attachments in their household"
  ON attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = attachments.entry_id
        AND is_member(entries.household_id)
    )
  );

-- Books policies
CREATE POLICY "Members can view books in their household"
  ON books FOR SELECT
  USING (is_member(household_id));

CREATE POLICY "Members can create books in their household"
  ON books FOR INSERT
  WITH CHECK (is_member(household_id));

CREATE POLICY "Members can update books in their household"
  ON books FOR UPDATE
  USING (is_member(household_id));

CREATE POLICY "Members can delete books in their household"
  ON books FOR DELETE
  USING (is_member(household_id));

-- Book entries policies
CREATE POLICY "Members can view book entries in their household"
  ON book_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_entries.book_id
        AND is_member(books.household_id)
    )
  );

CREATE POLICY "Members can manage book entries in their household"
  ON book_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM books
      WHERE books.id = book_entries.book_id
        AND is_member(books.household_id)
    )
  );

-- Reminders policies
CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON reminders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    is_member(household_id)
  );

CREATE POLICY "Users can update their own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Audit logs policies (read-only for members)
CREATE POLICY "Members can view audit logs in their household"
  ON audit_logs FOR SELECT
  USING (
    household_id IS NULL OR
    is_member(household_id)
  );



