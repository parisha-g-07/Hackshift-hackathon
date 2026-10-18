-- SyncTies Migration 001: Core Relational Schema
-- Enables UUID generation and sets up clean normalized tables

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'alum')),
  institution TEXT NOT NULL DEFAULT 'University Pilot',
  study_year INTEGER CHECK (study_year IS NULL OR (study_year >= 1 AND study_year <= 6)),
  expected_graduation_year INTEGER,
  expected_graduation_month INTEGER CHECK (expected_graduation_month IS NULL OR (expected_graduation_month >= 1 AND expected_graduation_month <= 12)),
  graduation_year INTEGER,
  job_title TEXT,
  company TEXT,
  industry TEXT,
  bio TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active_verified ON public.profiles(is_active, verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at DESC);

-- 2. Domains Table
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domains_slug ON public.domains(slug);

-- 3. Profile Domains (User declared expertise / interests)
CREATE TABLE IF NOT EXISTS public.profile_domains (
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  expertise_type TEXT NOT NULL DEFAULT 'expertise' CHECK (expertise_type IN ('expertise', 'interest', 'primary', 'secondary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, domain_id)
);

-- 4. Help Types Table
CREATE TABLE IF NOT EXISTS public.help_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Help Type Compatibility Matrix (0 to 100)
CREATE TABLE IF NOT EXISTS public.help_type_compatibility (
  requested_help_type_id UUID NOT NULL REFERENCES public.help_types(id) ON DELETE CASCADE,
  offered_help_type_id UUID NOT NULL REFERENCES public.help_types(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  rationale TEXT,
  version TEXT NOT NULL DEFAULT 'v1',
  PRIMARY KEY (requested_help_type_id, offered_help_type_id)
);

-- 6. Intents Table (Student Goals)
CREATE TABLE IF NOT EXISTS public.intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  help_type_id UUID NOT NULL REFERENCES public.help_types(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fulfilled', 'closed')),
  target_role TEXT,
  target_company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_intents_user ON public.intents(user_id);
CREATE INDEX IF NOT EXISTS idx_intents_status ON public.intents(status);

-- 7. Intent Domains
CREATE TABLE IF NOT EXISTS public.intent_domains (
  intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  PRIMARY KEY (intent_id, domain_id)
);

-- 8. Offers Table (Alumni Mentoring/Help Offers)
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  help_type_id UUID NOT NULL REFERENCES public.help_types(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  opportunity_available BOOLEAN NOT NULL DEFAULT false,
  opportunity_title TEXT,
  opportunity_company TEXT,
  opportunity_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_user ON public.offers(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);

-- 9. Offer Domains
CREATE TABLE IF NOT EXISTS public.offer_domains (
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  PRIMARY KEY (offer_id, domain_id)
);

-- 10. Versioned Matching Weights Configuration
CREATE TABLE IF NOT EXISTS public.matching_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  weight_domain NUMERIC(4,2) NOT NULL DEFAULT 0.40,
  weight_help_type NUMERIC(4,2) NOT NULL DEFAULT 0.30,
  weight_capacity NUMERIC(4,2) NOT NULL DEFAULT 0.20,
  weight_recency NUMERIC(4,2) NOT NULL DEFAULT 0.10,
  recency_half_life_days NUMERIC(4,1) NOT NULL DEFAULT 14.0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Student Monthly Tokens Summary
CREATE TABLE IF NOT EXISTS public.student_monthly_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  tokens_granted INTEGER NOT NULL DEFAULT 5,
  tokens_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

-- 12. Immutable Token Ledger
CREATE TABLE IF NOT EXISTS public.token_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('grant', 'spend', 'refund', 'adjustment')),
  amount INTEGER NOT NULL,
  request_id UUID,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  idempotency_key TEXT UNIQUE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_ledger_user_period ON public.token_ledger(user_id, period_start);

-- 12. Alumni Monthly Request Review Capacity
CREATE TABLE IF NOT EXISTS public.alumni_capacity_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  monthly_limit INTEGER NOT NULL DEFAULT 3 CHECK (monthly_limit >= 0),
  reserved_count INTEGER NOT NULL DEFAULT 0 CHECK (reserved_count >= 0),
  processed_count INTEGER NOT NULL DEFAULT 0 CHECK (processed_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_capacity_user_period ON public.alumni_capacity_monthly(user_id, period_start);

-- 13. Connection Requests
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alum_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'deferred', 'ignored', 'withdrawn', 'expired')),
  student_message TEXT NOT NULL,
  repeat_contact_in_month BOOLEAN NOT NULL DEFAULT false,
  repeat_reason TEXT,
  alumni_response_note TEXT,
  idempotency_key TEXT UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_student ON public.connection_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_alum ON public.connection_requests(alum_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_intent ON public.connection_requests(intent_id);

-- 14. Goals (Collaborative Goal from Accepted Request)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.connection_requests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alum_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'fulfilled', 'closed', 'cancelled')),
  student_confirmed_at TIMESTAMPTZ,
  alum_confirmed_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_student ON public.goals(student_id);
CREATE INDEX IF NOT EXISTS idx_goals_alum ON public.goals(alum_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

-- 15. Goal Updates / Milestones
CREATE TABLE IF NOT EXISTS public.goal_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Connection Briefs Cache (AI-generated explanation)
CREATE TABLE IF NOT EXISTS public.connection_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alum_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  input_hash TEXT NOT NULL,
  brief_text TEXT NOT NULL,
  model_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, alum_id, intent_id, input_hash)
);

-- 18. Feedback Table (Submitted after mutual fulfillment)
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  referral_status TEXT CHECK (referral_status IN ('none', 'offered', 'submitted', 'interview', 'hired', 'unsuccessful')) DEFAULT 'none',
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, reviewer_id)
);

-- 19. Notifications / Outbox Events Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read_at);

-- 19. Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name, created_at);

-- 20. Moderation Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'intent', 'offer', 'message', 'goal')),
  target_id UUID,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
-- SyncTies Migration 002: Row Level Security (RLS) Policies

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_type_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intent_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_monthly_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_capacity_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Domains & Help Types
CREATE POLICY "Domains are viewable by everyone"
  ON public.domains FOR SELECT
  USING (is_active = true);

CREATE POLICY "Profile domains viewable by authenticated users"
  ON public.profile_domains FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own profile domains"
  ON public.profile_domains FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Help types are viewable by everyone"
  ON public.help_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Help type compatibility viewable by everyone"
  ON public.help_type_compatibility FOR SELECT
  USING (true);

-- 3. Intents (Student Goals)
CREATE POLICY "Users can view their own intents"
  ON public.intents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Alumni can view open intents for matching"
  ON public.intents FOR SELECT
  TO authenticated
  USING (status = 'open');

CREATE POLICY "Students can insert their own intents"
  ON public.intents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update their own intents"
  ON public.intents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Intent domains viewable by authenticated users"
  ON public.intent_domains FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can manage intent domains for own intents"
  ON public.intent_domains FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.intents WHERE id = intent_id AND user_id = auth.uid()));

-- 4. Offers (Alumni Mentoring Offers)
CREATE POLICY "Active offers are viewable by authenticated users"
  ON public.offers FOR SELECT
  TO authenticated
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Alumni can insert their own offers"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Alumni can update their own offers"
  ON public.offers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Offer domains viewable by authenticated users"
  ON public.offer_domains FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Alumni can manage offer domains for own offers"
  ON public.offer_domains FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.offers WHERE id = offer_id AND user_id = auth.uid()));

-- 5. Tokens & Ledger
CREATE POLICY "Students can view their own token balance"
  ON public.student_monthly_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Students can view their own token ledger"
  ON public.token_ledger FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 6. Alumni Capacity
CREATE POLICY "Alumni can view and manage their own capacity"
  ON public.alumni_capacity_monthly FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can view capacity availability during matching"
  ON public.alumni_capacity_monthly FOR SELECT
  TO authenticated
  USING (true);

-- 7. Connection Requests
CREATE POLICY "Participants can view their connection requests"
  ON public.connection_requests FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR alum_id = auth.uid());

CREATE POLICY "Students can insert connection requests"
  ON public.connection_requests FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants can update connection requests based on role"
  ON public.connection_requests FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() OR alum_id = auth.uid());

-- 8. Goals
CREATE POLICY "Goal participants can view goals"
  ON public.goals FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR alum_id = auth.uid());

CREATE POLICY "Goal participants can update goals"
  ON public.goals FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() OR alum_id = auth.uid());

CREATE POLICY "Goal updates viewable by participants"
  ON public.goal_updates FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.goals g
    WHERE g.id = goal_id AND (g.student_id = auth.uid() OR g.alum_id = auth.uid())
  ));

CREATE POLICY "Goal participants can insert updates"
  ON public.goal_updates FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = goal_id AND (g.student_id = auth.uid() OR g.alum_id = auth.uid())
    )
  );

-- 9. Connection Briefs Cache
CREATE POLICY "Participants can view connection briefs"
  ON public.connection_briefs FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR alum_id = auth.uid());

-- 10. Feedback
CREATE POLICY "Feedback viewable by goal participants"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (reviewer_id = auth.uid() OR reviewee_id = auth.uid());

CREATE POLICY "Reviewer can insert feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- 11. Notifications
CREATE POLICY "Users can view and manage their own notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 12. Analytics Events
CREATE POLICY "Authenticated users can record events"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 13. Reports (Inappropriate Behavior / Content)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit violation reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reporters can view their own submitted reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());
-- SyncTies Migration 003: Canonical Seed Data for Domains, Help Types & Compatibility

-- 1. Insert Canonical Domains
INSERT INTO public.domains (id, slug, name, category) VALUES
  ('11111111-1111-1111-1111-111111111101', 'computer-science', 'Computer Science', 'Technology'),
  ('11111111-1111-1111-1111-111111111102', 'data-science', 'Data Science', 'Technology'),
  ('11111111-1111-1111-1111-111111111103', 'ai-ml', 'AI & Machine Learning', 'Technology'),
  ('11111111-1111-1111-1111-111111111104', 'web-development', 'Web Development', 'Technology'),
  ('11111111-1111-1111-1111-111111111105', 'cybersecurity', 'Cybersecurity', 'Technology'),
  ('11111111-1111-1111-1111-111111111106', 'product-management', 'Product Management', 'Business & Product'),
  ('11111111-1111-1111-1111-111111111107', 'finance', 'Finance & Investment', 'Business & Finance'),
  ('11111111-1111-1111-1111-111111111108', 'consulting', 'Consulting & Strategy', 'Business & Strategy'),
  ('11111111-1111-1111-1111-111111111109', 'design', 'UI/UX & Product Design', 'Design'),
  ('11111111-1111-1111-1111-111111111110', 'research', 'Academic & Industrial Research', 'Research'),
  ('11111111-1111-1111-1111-111111111111', 'entrepreneurship', 'Entrepreneurship & Startups', 'Business'),
  ('11111111-1111-1111-1111-111111111112', 'marketing', 'Growth & Marketing', 'Business'),
  ('11111111-1111-1111-1111-111111111113', 'healthcare', 'Healthcare & BioTech', 'Life Sciences'),
  ('11111111-1111-1111-1111-111111111114', 'other', 'Other Professional Domains', 'General')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;

-- 2. Insert Canonical Help Types
INSERT INTO public.help_types (id, slug, name, description) VALUES
  ('22222222-2222-2222-2222-222222222201', 'referral', 'Job or Internship Referral', 'Direct internal employee referral for an active opening'),
  ('22222222-2222-2222-2222-222222222202', 'mock-interview', 'Mock Interview & Feedback', 'Technical, behavioral, or product case interview simulation'),
  ('22222222-2222-2222-2222-222222222203', 'resume-review', 'Resume & CV Review', 'Constructive critique and line-by-line feedback on your resume'),
  ('22222222-2222-2222-2222-222222222204', 'career-guidance', 'Career & Field Guidance', 'Strategic advice on role transitions, career roadmap, and industry trends'),
  ('22222222-2222-2222-2222-222222222205', 'higher-ed-guidance', 'Higher Education Guidance', 'Advice on master degrees, PhD applications, GRE/GMAT, and universities'),
  ('22222222-2222-2222-2222-222222222206', 'portfolio-review', 'Portfolio & Code Review', 'Review of design portfolio, GitHub projects, or open-source PRs'),
  ('22222222-2222-2222-2222-222222222207', 'project-guidance', 'Capstone & Project Mentorship', 'Technical direction on university or side projects'),
  ('22222222-2222-2222-2222-222222222208', 'other', 'General Mentoring', 'Custom professional discussion')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 3. Populate Help Type Compatibility Matrix
-- Self-compatibility is always 100
INSERT INTO public.help_type_compatibility (requested_help_type_id, offered_help_type_id, score)
SELECT id, id, 100.0 FROM public.help_types
ON CONFLICT (requested_help_type_id, offered_help_type_id) DO UPDATE SET score = 100.0;

-- Configured cross-type affinities:
-- Mock Interview (2202) -> Career Guidance (2204): 70
-- Resume Review (2203) -> Career Guidance (2204): 70
-- Portfolio Review (2206) -> Resume Review (2203): 70
-- Project Guidance (2207) -> Career Guidance (2204): 70
-- Referral (2201) -> Mock Interview (2202): 40
-- Referral (2201) -> Resume Review (2203): 40
-- Higher Ed (2205) -> Career Guidance (2204): 70
INSERT INTO public.help_type_compatibility (requested_help_type_id, offered_help_type_id, score) VALUES
  ('22222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222204', 70.0),
  ('22222222-2222-2222-2222-222222222203', '22222222-2222-2222-2222-222222222204', 70.0),
  ('22222222-2222-2222-2222-222222222206', '22222222-2222-2222-2222-222222222203', 70.0),
  ('22222222-2222-2222-2222-222222222207', '22222222-2222-2222-2222-222222222204', 70.0),
  ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222202', 40.0),
  ('22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222203', 40.0),
  ('22222222-2222-2222-2222-222222222205', '22222222-2222-2222-2222-222222222204', 70.0)
ON CONFLICT (requested_help_type_id, offered_help_type_id) DO UPDATE SET score = EXCLUDED.score;

-- 4. Seed Matching Config (Version 1 Default)
INSERT INTO public.matching_config (
  version_name,
  is_active,
  weight_domain,
  weight_help_type,
  weight_capacity,
  weight_recency,
  recency_half_life_days,
  description
) VALUES (
  'matching_weights_v1',
  true,
  0.40,
  0.30,
  0.20,
  0.10,
  14.0,
  'Initial pilot weighted scoring model: 40% Domain Jaccard, 30% Help Fit, 20% Capacity, 10% Recency'
) ON CONFLICT (version_name) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  weight_domain = EXCLUDED.weight_domain,
  weight_help_type = EXCLUDED.weight_help_type,
  weight_capacity = EXCLUDED.weight_capacity,
  weight_recency = EXCLUDED.weight_recency,
  recency_half_life_days = EXCLUDED.recency_half_life_days;
-- SyncTies Migration 004: Atomic Stored Procedures & Functions
-- 1. Pure Deterministic SQL Matching Function
-- 2. Atomic Connection Request RPC with Token Debit + Capacity Reservation
-- 3. Mutual Dual Goal Completion RPC

-- ============================================================================
-- 1. MATCHING RPC FUNCTION: score_matches_for_intent
-- ============================================================================
CREATE OR REPLACE FUNCTION public.score_matches_for_intent(
  p_intent_id UUID,
  p_student_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  alum_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  company TEXT,
  industry TEXT,
  bio TEXT,
  graduation_year INT,
  last_active_at TIMESTAMPTZ,
  offer_id UUID,
  offer_title TEXT,
  offer_help_type_id UUID,
  offer_help_type_name TEXT,
  d_score NUMERIC,
  h_score NUMERIC,
  c_score NUMERIC,
  r_score NUMERIC,
  total_score NUMERIC,
  matched_domains JSONB,
  remaining_capacity INT,
  monthly_limit INT,
  is_repeat_contact BOOLEAN,
  score_version TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Named configuration: matching_weights_v1
  v_weight_d CONSTANT NUMERIC := 0.40;
  v_weight_h CONSTANT NUMERIC := 0.30;
  v_weight_c CONSTANT NUMERIC := 0.20;
  v_weight_r CONSTANT NUMERIC := 0.10;
  v_recency_half_life_days CONSTANT NUMERIC := 14.0;
  v_score_version CONSTANT TEXT := 'matching_weights_v1';
  v_intent_help_type_id UUID;
  v_current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  -- 1. Get the intent's requested help type
  SELECT help_type_id INTO v_intent_help_type_id
  FROM public.intents
  WHERE id = p_intent_id AND user_id = p_student_id AND status = 'open';

  IF v_intent_help_type_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH
  -- Student canonical intent domains
  student_domains AS (
    SELECT domain_id FROM public.intent_domains WHERE intent_id = p_intent_id
  ),
  student_domain_count AS (
    SELECT COUNT(*)::NUMERIC AS count FROM student_domains
  ),

  -- Eligible verified alumni with active offers
  candidate_offers AS (
    SELECT
      p.id AS c_alum_id,
      p.full_name AS c_full_name,
      p.avatar_url AS c_avatar_url,
      p.job_title AS c_job_title,
      p.company AS c_company,
      p.industry AS c_industry,
      p.bio AS c_bio,
      p.graduation_year AS c_graduation_year,
      p.last_active_at AS c_last_active_at,
      o.id AS c_offer_id,
      o.title AS c_offer_title,
      o.help_type_id AS c_offer_help_type_id,
      ht.name AS c_offer_help_type_name,
      COALESCE(cap.monthly_limit, 3) AS c_monthly_limit,
      COALESCE(cap.reserved_count, 0) + COALESCE(cap.processed_count, 0) AS c_allocated,
      GREATEST(0, COALESCE(cap.monthly_limit, 3) - (COALESCE(cap.reserved_count, 0) + COALESCE(cap.processed_count, 0))) AS c_remaining_capacity
    FROM public.profiles p
    JOIN public.offers o ON o.user_id = p.id AND o.status = 'active'
    JOIN public.help_types ht ON ht.id = o.help_type_id
    LEFT JOIN public.alumni_capacity_monthly cap 
      ON cap.user_id = p.id AND cap.period_start = v_current_month
    WHERE p.role = 'alum'
      AND p.is_active = true
      AND p.id <> p_student_id
      -- Capacity filter: must have at least 1 remaining slot
      AND GREATEST(0, COALESCE(cap.monthly_limit, 3) - (COALESCE(cap.reserved_count, 0) + COALESCE(cap.processed_count, 0))) > 0
      -- Exclude existing active/pending connection request
      AND NOT EXISTS (
        SELECT 1 FROM public.connection_requests cr
        WHERE cr.student_id = p_student_id
          AND cr.alum_id = p.id
          AND cr.intent_id = p_intent_id
          AND cr.status IN ('pending', 'accepted')
      )
  ),

  -- Calculate Factors for each candidate offer
  scored_offers AS (
    SELECT
      co.*,
      -- Overlap calculation (Jaccard similarity D = 100 * |S ∩ A| / |S ∪ A|)
      (
        SELECT
          CASE
            WHEN (sdc.count + COUNT(od.domain_id) - COUNT(CASE WHEN sd.domain_id IS NOT NULL THEN 1 END)) = 0 THEN 0.0
            ELSE ROUND(
              (100.0 * COUNT(CASE WHEN sd.domain_id IS NOT NULL THEN 1 END)) /
              NULLIF(sdc.count + COUNT(od.domain_id) - COUNT(CASE WHEN sd.domain_id IS NOT NULL THEN 1 END), 0),
              2
            )
          END
        FROM public.offer_domains od
        LEFT JOIN student_domains sd ON sd.domain_id = od.domain_id
        CROSS JOIN student_domain_count sdc
        WHERE od.offer_id = co.c_offer_id
        GROUP BY sdc.count
      ) AS calc_d_score,

      -- Help type compatibility factor H (0 to 100)
      COALESCE(
        (SELECT comp.score FROM public.help_type_compatibility comp
         WHERE comp.requested_help_type_id = v_intent_help_type_id
           AND comp.offered_help_type_id = co.c_offer_help_type_id),
        0.0
      ) AS calc_h_score,

      -- Available Capacity score C = 100 * remaining / limit
      ROUND(
        LEAST(100.0, GREATEST(0.0, 100.0 * co.c_remaining_capacity / NULLIF(co.c_monthly_limit, 0))),
        2
      ) AS calc_c_score,

      -- Recent activity factor R = 100 * 2 ^ (-age_days / 14)
      ROUND(
        LEAST(100.0, GREATEST(0.0,
          100.0 * POWER(2.0, -GREATEST(0.0, EXTRACT(EPOCH FROM (now() - co.c_last_active_at)) / 86400.0) / v_recency_half_life_days)
        ))::NUMERIC,
        2
      ) AS calc_r_score,

      -- Matched domain JSON array
      (
        SELECT jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'slug', d.slug))
        FROM public.offer_domains od
        JOIN student_domains sd ON sd.domain_id = od.domain_id
        JOIN public.domains d ON d.id = od.domain_id
        WHERE od.offer_id = co.c_offer_id
      ) AS calc_matched_domains,

      -- Check if repeat contact in current month
      EXISTS (
        SELECT 1 FROM public.connection_requests rcr
        WHERE rcr.student_id = p_student_id
          AND rcr.alum_id = co.c_alum_id
          AND rcr.created_at >= v_current_month::TIMESTAMPTZ
      ) AS calc_is_repeat
    FROM candidate_offers co
  ),

  -- Weighted Total Score: matching_weights_v1
  ranked_results AS (
    SELECT
      so.c_alum_id AS alum_id,
      so.c_full_name AS full_name,
      so.c_avatar_url AS avatar_url,
      so.c_job_title AS job_title,
      so.c_company AS company,
      so.c_industry AS industry,
      so.c_bio AS bio,
      so.c_graduation_year AS graduation_year,
      so.c_last_active_at AS last_active_at,
      so.c_offer_id AS offer_id,
      so.c_offer_title AS offer_title,
      so.c_offer_help_type_id AS offer_help_type_id,
      so.c_offer_help_type_name AS offer_help_type_name,
      COALESCE(so.calc_d_score, 0.0) AS d_score,
      COALESCE(so.calc_h_score, 0.0) AS h_score,
      COALESCE(so.calc_c_score, 0.0) AS c_score,
      COALESCE(so.calc_r_score, 0.0) AS r_score,
      ROUND(
        (v_weight_d * COALESCE(so.calc_d_score, 0.0)) +
        (v_weight_h * COALESCE(so.calc_h_score, 0.0)) +
        (v_weight_c * COALESCE(so.calc_c_score, 0.0)) +
        (v_weight_r * COALESCE(so.calc_r_score, 0.0)),
        2
      ) AS total_score,
      COALESCE(so.calc_matched_domains, '[]'::jsonb) AS matched_domains,
      so.c_remaining_capacity AS remaining_capacity,
      so.c_monthly_limit AS monthly_limit,
      so.calc_is_repeat AS is_repeat_contact,
      ROW_NUMBER() OVER (
        PARTITION BY so.c_alum_id 
        ORDER BY 
          ((v_weight_d * COALESCE(so.calc_d_score, 0.0)) + (v_weight_h * COALESCE(so.calc_h_score, 0.0))) DESC,
          so.c_offer_id ASC
      ) AS offer_rank_per_alum
    FROM scored_offers so
  )
  SELECT
    r.alum_id,
    r.full_name,
    r.avatar_url,
    r.job_title,
    r.company,
    r.industry,
    r.bio,
    r.graduation_year,
    r.last_active_at,
    r.offer_id,
    r.offer_title,
    r.offer_help_type_id,
    r.offer_help_type_name,
    r.d_score,
    r.h_score,
    r.c_score,
    r.r_score,
    r.total_score,
    r.matched_domains,
    r.remaining_capacity,
    r.monthly_limit,
    r.is_repeat_contact,
    v_score_version AS score_version
  FROM ranked_results r
  WHERE r.offer_rank_per_alum = 1
  ORDER BY
    r.total_score DESC,
    r.h_score DESC,
    r.c_score DESC,
    r.last_active_at DESC,
    r.alum_id ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


-- ============================================================================
-- 2. ATOMIC CONNECTION REQUEST CREATION: create_connection_request_atomic
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_connection_request_atomic(
  p_student_id UUID,
  p_alum_id UUID,
  p_intent_id UUID,
  p_offer_id UUID,
  p_student_message TEXT,
  p_repeat_reason TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_student_role TEXT;
  v_student_tokens INT;
  v_alum_role TEXT;
  v_alum_limit INT;
  v_alum_reserved INT;
  v_alum_processed INT;
  v_is_repeat BOOLEAN := false;
  v_intent_title TEXT;
  v_new_request_id UUID;
  v_new_goal_id UUID;
  v_expiry_days INT := 14;
BEGIN
  -- 1. Check idempotency if key provided
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_new_request_id
    FROM public.connection_requests
    WHERE idempotency_key = p_idempotency_key;

    IF v_new_request_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'request_id', v_new_request_id,
        'message', 'Request already processed (idempotent)'
      );
    END IF;
  END IF;

  -- 2. Validate Student
  SELECT role INTO v_student_role
  FROM public.profiles
  WHERE id = p_student_id AND is_active = true;

  IF v_student_role <> 'student' THEN
    RAISE EXCEPTION 'Only active students can initiate connection requests';
  END IF;

  -- 3. Validate Alumnus
  SELECT role INTO v_alum_role
  FROM public.profiles
  WHERE id = p_alum_id AND is_active = true;

  IF v_alum_role <> 'alum' THEN
    RAISE EXCEPTION 'Target recipient must be an active alumnus';
  END IF;

  IF p_student_id = p_alum_id THEN
    RAISE EXCEPTION 'Cannot send connection request to yourself';
  END IF;

  -- 4. Validate Intent
  SELECT title INTO v_intent_title
  FROM public.intents
  WHERE id = p_intent_id AND user_id = p_student_id AND status = 'open';

  IF v_intent_title IS NULL THEN
    RAISE EXCEPTION 'Intent must exist, belong to the student, and be in open status';
  END IF;

  -- 5. Prevent Duplicate Pending/Active Request for the same pair and intent
  IF EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE student_id = p_student_id
      AND alum_id = p_alum_id
      AND intent_id = p_intent_id
      AND status IN ('pending', 'accepted')
  ) THEN
    RAISE EXCEPTION 'An active or pending connection request already exists for this intent';
  END IF;

  -- 6. Check Repeat Contact in Current Month
  IF EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE student_id = p_student_id
      AND alum_id = p_alum_id
      AND created_at >= v_current_month::TIMESTAMPTZ
  ) THEN
    v_is_repeat := true;
    IF p_repeat_reason IS NULL OR length(trim(p_repeat_reason)) < 5 THEN
      RAISE EXCEPTION 'Repeat contact requires an explicit justification';
    END IF;
  END IF;

  -- 7. ATOMIC TOKEN CHECK & LOCK (FOR UPDATE)
  -- Ensure student token row exists for the month
  INSERT INTO public.student_monthly_tokens (user_id, period_start, tokens_granted, tokens_spent)
  VALUES (p_student_id, v_current_month, 5, 0)
  ON CONFLICT (user_id, period_start) DO NOTHING;

  SELECT (tokens_granted - tokens_spent) INTO v_student_tokens
  FROM public.student_monthly_tokens
  WHERE user_id = p_student_id AND period_start = v_current_month
  FOR UPDATE;

  IF v_student_tokens <= 0 THEN
    RAISE EXCEPTION 'Insufficient monthly tokens. Monthly token grant balance is 0';
  END IF;

  -- 8. ATOMIC CAPACITY CHECK & LOCK (FOR UPDATE)
  -- Ensure alumni capacity row exists for the month
  INSERT INTO public.alumni_capacity_monthly (user_id, period_start, monthly_limit, reserved_count, processed_count)
  VALUES (p_alum_id, v_current_month, 3, 0, 0)
  ON CONFLICT (user_id, period_start) DO NOTHING;

  SELECT monthly_limit, reserved_count, processed_count
  INTO v_alum_limit, v_alum_reserved, v_alum_processed
  FROM public.alumni_capacity_monthly
  WHERE user_id = p_alum_id AND period_start = v_current_month
  FOR UPDATE;

  IF (v_alum_limit - (v_alum_reserved + v_alum_processed)) <= 0 THEN
    RAISE EXCEPTION 'Alumnus has reached their monthly review capacity limit';
  END IF;

  -- 9. DEBIT TOKEN & INSERT IMMUTABLE LEDGER
  UPDATE public.student_monthly_tokens
  SET tokens_spent = tokens_spent + 1, updated_at = now()
  WHERE user_id = p_student_id AND period_start = v_current_month;

  -- 10. RESERVE CAPACITY SLOT
  UPDATE public.alumni_capacity_monthly
  SET reserved_count = reserved_count + 1, updated_at = now()
  WHERE user_id = p_alum_id AND period_start = v_current_month;

  -- 11. CREATE CONNECTION REQUEST
  INSERT INTO public.connection_requests (
    student_id,
    alum_id,
    intent_id,
    offer_id,
    status,
    student_message,
    repeat_contact_in_month,
    repeat_reason,
    idempotency_key,
    expires_at
  ) VALUES (
    p_student_id,
    p_alum_id,
    p_intent_id,
    p_offer_id,
    'pending',
    p_student_message,
    v_is_repeat,
    p_repeat_reason,
    p_idempotency_key,
    now() + (v_expiry_days || ' days')::INTERVAL
  ) RETURNING id INTO v_new_request_id;

  -- Write Token Ledger entry referencing request
  INSERT INTO public.token_ledger (
    user_id,
    period_start,
    entry_type,
    amount,
    request_id,
    reason
  ) VALUES (
    p_student_id,
    v_current_month,
    'spend',
    -1,
    v_new_request_id,
    CASE WHEN v_is_repeat THEN 'Connection request (Repeat Contact)' ELSE 'Connection request outreach' END
  );

  -- 12. CREATE COLLABORATIVE GOAL RECORD
  INSERT INTO public.goals (
    request_id,
    student_id,
    alum_id,
    title,
    description,
    status
  ) VALUES (
    v_new_request_id,
    p_student_id,
    p_alum_id,
    v_intent_title,
    p_student_message,
    'open'
  ) RETURNING id INTO v_new_goal_id;

  -- 13. NOTIFY ALUMNUS
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    body,
    link
  ) VALUES (
    p_alum_id,
    'new_request',
    CASE WHEN v_is_repeat THEN 'Repeat Connection Request' ELSE 'New Connection Request' END,
    'A student has requested a connection for goal: "' || v_intent_title || '"',
    '/alumni/requests'
  );

  -- 14. RECORD ANALYTICS EVENT
  INSERT INTO public.analytics_events (
    user_id,
    event_name,
    metadata
  ) VALUES (
    p_student_id,
    'connection_requested',
    jsonb_build_object(
      'request_id', v_new_request_id,
      'alum_id', p_alum_id,
      'intent_id', p_intent_id,
      'is_repeat', v_is_repeat
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_new_request_id,
    'goal_id', v_new_goal_id,
    'tokens_remaining', v_student_tokens - 1,
    'is_repeat', v_is_repeat
  );
END;
$$;


-- ============================================================================
-- 3. MUTUAL DUAL GOAL CONFIRMATION: confirm_goal_completion
-- ============================================================================
CREATE OR REPLACE FUNCTION public.confirm_goal_completion(
  p_goal_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_alum_id UUID;
  v_status TEXT;
  v_student_conf TIMESTAMPTZ;
  v_alum_conf TIMESTAMPTZ;
  v_is_now_fulfilled BOOLEAN := false;
BEGIN
  -- Lock the goal row FOR UPDATE
  SELECT student_id, alum_id, status, student_confirmed_at, alum_confirmed_at
  INTO v_student_id, v_alum_id, v_status, v_student_conf, v_alum_conf
  FROM public.goals
  WHERE id = p_goal_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  IF v_status = 'fulfilled' THEN
    RETURN jsonb_build_object('success', true, 'status', 'fulfilled', 'already_fulfilled', true);
  END IF;

  IF p_user_id = v_student_id THEN
    v_student_conf := now();
    UPDATE public.goals SET student_confirmed_at = v_student_conf, updated_at = now() WHERE id = p_goal_id;
  ELSIF p_user_id = v_alum_id THEN
    v_alum_conf := now();
    UPDATE public.goals SET alum_confirmed_at = v_alum_conf, updated_at = now() WHERE id = p_goal_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized: only goal participants can confirm completion';
  END IF;

  -- Check if BOTH participants have now confirmed
  IF v_student_conf IS NOT NULL AND v_alum_conf IS NOT NULL THEN
    UPDATE public.goals
    SET status = 'fulfilled', fulfilled_at = now(), updated_at = now()
    WHERE id = p_goal_id;

    v_is_now_fulfilled := true;

    -- Notify both parties
    INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
      (v_student_id, 'goal_fulfilled', 'Goal Mutually Fulfilled! 🎉', 'Both you and your alumni partner have confirmed completion. You can now leave feedback.', '/goals/' || p_goal_id),
      (v_alum_id, 'goal_fulfilled', 'Goal Mutually Fulfilled! 🎉', 'Both you and the student have confirmed completion.', '/goals/' || p_goal_id);

    -- Record analytics event
    INSERT INTO public.analytics_events (user_id, event_name, metadata) VALUES
      (p_user_id, 'goal_fulfilled', jsonb_build_object('goal_id', p_goal_id, 'student_id', v_student_id, 'alum_id', v_alum_id));
  ELSE
    -- Notify other party that one confirmation arrived
    IF p_user_id = v_student_id THEN
      INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
        (v_alum_id, 'goal_confirmation_pending', 'Student Confirmed Goal Completion', 'The student has confirmed goal completion. Please confirm to finalize fulfillment.', '/goals/' || p_goal_id);
    ELSE
      INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
        (v_student_id, 'goal_confirmation_pending', 'Alumnus Confirmed Goal Completion', 'The alumnus has confirmed goal completion. Please confirm to finalize fulfillment.', '/goals/' || p_goal_id);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', CASE WHEN v_is_now_fulfilled THEN 'fulfilled' ELSE 'awaiting_confirmation' END,
    'student_confirmed', v_student_conf IS NOT NULL,
    'alum_confirmed', v_alum_conf IS NOT NULL,
    'is_fulfilled', v_is_now_fulfilled
  );
END;
$$;
-- SyncTies Migration 005: Auth Profiles Trigger, OAuth Identity Handling & Gate Removal
-- 1. Automatic trigger to provision exactly 1 profile per auth.users.id
-- 2. Safe metadata extraction for email/password, Google OAuth, and LinkedIn (OIDC)
-- 3. Elimination of college-domain requirements and mandatory verification_status gates

-- ============================================================================
-- 1. AUTH TRIGGER FUNCTION: handle_new_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_institution TEXT;
BEGIN
  -- 1. Safe role extraction from user metadata
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  IF v_role NOT IN ('student', 'alum') THEN
    v_role := 'student';
  END IF;

  -- 2. Safe full name extraction with fallbacks across email and OAuth providers
  v_full_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(split_part(new.email, '@', 1)), ''),
    'SyncTies Member'
  );

  -- 3. Safe avatar URL extraction (Google: picture, LinkedIn: picture/avatar_url)
  v_avatar_url := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  -- 4. Self-reported institution (defaults to pilot placeholder until onboarding completion)
  v_institution := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data->>'institution'), ''),
    'University Pilot'
  );

  -- 5. Insert profile maintaining strictly 1 profiles row for each auth.users.id
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    institution,
    verification_status,
    is_active,
    last_active_at,
    created_at,
    updated_at
  ) VALUES (
    new.id,
    new.email,
    v_full_name,
    v_avatar_url,
    v_role,
    v_institution,
    'unverified', -- Provider login confirms control of that account; does not by itself prove university verification
    true,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    last_active_at = now(),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Drop and recreate the auth trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. RELAX MATCHING & CAPACITY RPC GATES (No mandatory verification_status gate)
-- ============================================================================

-- Ensure score_matches_for_intent only filters active alumni (without requiring verification_status = 'verified')
CREATE OR REPLACE FUNCTION public.score_matches_for_intent(
  p_intent_id UUID,
  p_student_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  alum_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  company TEXT,
  industry TEXT,
  bio TEXT,
  graduation_year INT,
  last_active_at TIMESTAMPTZ,
  offer_id UUID,
  offer_title TEXT,
  offer_help_type_id UUID,
  offer_help_type_name TEXT,
  d_score NUMERIC,
  h_score NUMERIC,
  c_score NUMERIC,
  r_score NUMERIC,
  total_score NUMERIC,
  matched_domains JSONB,
  remaining_capacity INT,
  monthly_limit INT,
  is_repeat_contact BOOLEAN,
  score_version TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_weight_d CONSTANT NUMERIC := 0.40;
  v_weight_h CONSTANT NUMERIC := 0.30;
  v_weight_c CONSTANT NUMERIC := 0.20;
  v_weight_r CONSTANT NUMERIC := 0.10;
  v_recency_half_life_days CONSTANT NUMERIC := 14.0;
  v_score_version CONSTANT TEXT := 'matching_weights_v1';
  v_intent_help_type_id UUID;
  v_current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  SELECT help_type_id INTO v_intent_help_type_id
  FROM public.intents
  WHERE id = p_intent_id AND user_id = p_student_id AND status = 'open';

  IF v_intent_help_type_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH
  student_domains AS (
    SELECT domain_id FROM public.intent_domains WHERE intent_id = p_intent_id
  ),
  student_domain_count AS (
    SELECT COUNT(*)::NUMERIC AS count FROM student_domains
  ),
  candidate_offers AS (
    SELECT
      p.id AS c_alum_id,
      p.full_name AS c_full_name,
      p.avatar_url AS c_avatar_url,
      p.job_title AS c_job_title,
      p.company AS c_company,
      p.industry AS c_industry,
      p.bio AS c_bio,
      p.graduation_year AS c_graduation_year,
      p.last_active_at AS c_last_active_at,
      o.id AS c_offer_id,
      o.title AS c_offer_title,
      o.help_type_id AS c_offer_help_type_id,
      ht.name AS c_offer_help_type_name,
      COALESCE(cap.monthly_limit, 3) AS c_monthly_limit,
      COALESCE(cap.reserved_count, 0) + COALESCE(cap.processed_count, 0) AS c_allocated,
      GREATEST(0, COALESCE(cap.monthly_limit, 3) - (COALESCE(cap.reserved_count, 0) + COALESCE(cap.processed_count, 0))) AS c_remaining_capacity
    FROM public.profiles p
    JOIN public.offers o ON o.user_id = p.id AND o.status = 'active'
    JOIN public.help_types ht ON ht.id = o.help_type_id
    LEFT JOIN public.alumni_capacity_monthly cap 
      ON cap.user_id = p.id AND cap.period_start = v_current_month
    WHERE p.role = 'alum'
      AND p.is_active = true
      AND p.id <> p_student_id
      AND GREATEST(0, COALESCE(cap.monthly_limit, 3) - (COALESCE(cap.reserved_count, 0) + COALESCE(cap.processed_count, 0))) > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.connection_requests cr
        WHERE cr.student_id = p_student_id
          AND cr.alum_id = p.id
          AND cr.intent_id = p_intent_id
          AND cr.status IN ('pending', 'accepted')
      )
  ),
  scored_offers AS (
    SELECT
      co.*,
      (
        SELECT
          CASE
            WHEN (sdc.count + (SELECT COUNT(*) FROM public.offer_domains od WHERE od.offer_id = co.c_offer_id)) = 0 THEN 0.0
            ELSE ROUND(
              100.0 * (
                SELECT COUNT(*)::NUMERIC 
                FROM public.offer_domains od 
                WHERE od.offer_id = co.c_offer_id 
                  AND od.domain_id IN (SELECT domain_id FROM student_domains)
              ) / (
                sdc.count + (
                  SELECT COUNT(*)::NUMERIC 
                  FROM public.offer_domains od 
                  WHERE od.offer_id = co.c_offer_id 
                    AND od.domain_id NOT IN (SELECT domain_id FROM student_domains)
                )
              ), 2
            )
          END
        FROM student_domain_count sdc
      ) AS calc_d_score,
      COALESCE(
        (
          SELECT htc.score::NUMERIC
          FROM public.help_type_compatibility htc
          WHERE htc.requested_help_type_id = v_intent_help_type_id
            AND htc.offered_help_type_id = co.c_offer_help_type_id
          LIMIT 1
        ),
        CASE WHEN co.c_offer_help_type_id = v_intent_help_type_id THEN 100.0 ELSE 40.0 END
      ) AS calc_h_score,
      ROUND(
        100.0 * (co.c_remaining_capacity::NUMERIC / co.c_monthly_limit::NUMERIC), 2
      ) AS calc_c_score,
      ROUND(
        100.0 * EXP(
          - (LN(2.0) / v_recency_half_life_days) * GREATEST(0.0, EXTRACT(EPOCH FROM (now() - co.c_last_active_at)) / 86400.0)
        )::NUMERIC, 2
      ) AS calc_r_score,
      EXISTS (
        SELECT 1 FROM public.connection_requests cr_past
        WHERE cr_past.student_id = p_student_id
          AND cr_past.alum_id = co.c_alum_id
          AND cr_past.status IN ('accepted', 'declined', 'withdrawn', 'expired')
      ) AS calc_is_repeat,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', d.id,
              'name', d.name,
              'slug', d.slug
            )
          )
          FROM public.offer_domains od
          JOIN public.domains d ON d.id = od.domain_id
          WHERE od.offer_id = co.c_offer_id
            AND od.domain_id IN (SELECT domain_id FROM student_domains)
        ),
        '[]'::jsonb
      ) AS calc_matched_domains
    FROM candidate_offers co
  )
  SELECT
    so.c_alum_id AS alum_id,
    so.c_full_name AS full_name,
    so.c_avatar_url AS avatar_url,
    so.c_job_title AS job_title,
    so.c_company AS company,
    so.c_industry AS industry,
    so.c_bio AS bio,
    so.c_graduation_year AS graduation_year,
    so.c_last_active_at AS last_active_at,
    so.c_offer_id AS offer_id,
    so.c_offer_title AS offer_title,
    so.c_offer_help_type_id AS offer_help_type_id,
    so.c_offer_help_type_name AS offer_help_type_name,
    so.calc_d_score AS d_score,
    so.calc_h_score AS h_score,
    so.calc_c_score AS c_score,
    so.calc_r_score AS r_score,
    ROUND(
      (v_weight_d * so.calc_d_score) +
      (v_weight_h * so.calc_h_score) +
      (v_weight_c * so.calc_c_score) +
      (v_weight_r * so.calc_r_score), 2
    ) AS total_score,
    so.calc_matched_domains AS matched_domains,
    so.c_remaining_capacity AS remaining_capacity,
    so.c_monthly_limit AS monthly_limit,
    so.calc_is_repeat AS is_repeat_contact,
    v_score_version AS score_version
  FROM scored_offers so
  ORDER BY
    total_score DESC,
    so.calc_d_score DESC,
    so.calc_h_score DESC,
    so.calc_c_score DESC,
    so.calc_r_score DESC,
    so.c_last_active_at DESC,
    so.c_alum_id ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
