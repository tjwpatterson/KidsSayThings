-- Parent phone numbers table links verified sender numbers to households
CREATE TABLE parent_phone_numbers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  label text,
  verified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_parent_phone_numbers_phone ON parent_phone_numbers(phone_number);
CREATE INDEX idx_parent_phone_numbers_household ON parent_phone_numbers(household_id);

ALTER TABLE parent_phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can view parent phone numbers"
  ON parent_phone_numbers FOR SELECT
  USING (is_member(household_id));

CREATE POLICY "Household members can insert parent phone numbers"
  ON parent_phone_numbers FOR INSERT
  WITH CHECK (is_member(household_id));

CREATE POLICY "Household members can update parent phone numbers"
  ON parent_phone_numbers FOR UPDATE
  USING (is_member(household_id));

CREATE POLICY "Household members can delete parent phone numbers"
  ON parent_phone_numbers FOR DELETE
  USING (is_member(household_id));


