-- SyncTies Migration 006: Add expected_graduation_month to profiles
-- Additive migration for student expected graduation month (1-12)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS expected_graduation_month INTEGER 
CHECK (expected_graduation_month IS NULL OR (expected_graduation_month >= 1 AND expected_graduation_month <= 12));

COMMENT ON COLUMN public.profiles.expected_graduation_month IS 'Expected graduation calendar month (1-12) for academic study year determination';
