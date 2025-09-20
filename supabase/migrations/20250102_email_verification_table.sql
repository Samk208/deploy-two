-- Email verification table for secure email verification workflow
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own email verifications" ON email_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email verifications" ON email_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email verifications" ON email_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage all email verifications
CREATE POLICY "Service role can manage all email verifications" ON email_verifications
    FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_email_verifications_updated_at
    BEFORE UPDATE ON email_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_email_verifications_updated_at();
