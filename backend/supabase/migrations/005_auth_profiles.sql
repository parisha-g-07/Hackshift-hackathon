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
