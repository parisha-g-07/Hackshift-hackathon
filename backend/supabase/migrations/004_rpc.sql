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
