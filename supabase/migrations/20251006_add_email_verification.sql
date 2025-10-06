-- Add email_verified fields on profiles and verification_codes table with RLS

-- Add columns on profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_user_email ON verification_codes(user_id, email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can manage their own codes (idempotent)
DO $$
BEGIN
  -- Only create the policy if the table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'verification_codes'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'verification_codes'
        AND policyname = 'Users can manage own verification codes'
    ) THEN
      CREATE POLICY "Users can manage own verification codes"
      ON verification_codes
      FOR ALL
      USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_verification_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_verification_codes_updated_at ON verification_codes;
CREATE TRIGGER trg_update_verification_codes_updated_at
  BEFORE UPDATE ON verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_codes_updated_at();
