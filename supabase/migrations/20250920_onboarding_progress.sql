-- Onboarding progress persistence
-- Create table for step-by-step onboarding saves
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('influencer','brand')),
  current_step INTEGER NOT NULL CHECK (current_step >= 1 AND current_step <= 5),
  step INTEGER NOT NULL CHECK (step >= 1 AND step <= 5),
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, step)
);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own onboarding progress" ON onboarding_progress
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own onboarding progress" ON onboarding_progress
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding progress" ON onboarding_progress
FOR UPDATE USING (user_id = auth.uid());

-- Optional: Admins can view all
CREATE POLICY "Admins can view all onboarding progress" ON onboarding_progress
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step ON onboarding_progress(step);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_updated_at ON onboarding_progress(updated_at DESC);
