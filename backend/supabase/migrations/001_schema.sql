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
