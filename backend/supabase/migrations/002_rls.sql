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
