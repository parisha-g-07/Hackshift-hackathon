export type UserRole = "student" | "alum";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type IntentStatus = "open" | "in_progress" | "fulfilled" | "closed";
export type OfferStatus = "draft" | "active" | "paused" | "closed";
export type RequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "deferred"
  | "ignored"
  | "withdrawn"
  | "expired";
export type GoalStatus = "open" | "in_progress" | "fulfilled" | "closed" | "cancelled";
export type ReferralStatus =
  | "none"
  | "offered"
  | "submitted"
  | "interview"
  | "hired"
  | "unsuccessful";

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  institution: string;
  study_year?: number | null;
  expected_graduation_year?: number | null;
  expected_graduation_month?: number | null;
  graduation_year?: number | null;
  job_title?: string | null;
  company?: string | null;
  industry?: string | null;
  bio?: string | null;
  verification_status: VerificationStatus;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export interface Domain {
  id: string;
  slug: string;
  name: string;
  category?: string;
  is_active: boolean;
}

export interface HelpType {
  id: string;
  slug: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Intent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  help_type_id: string;
  status: IntentStatus;
  target_role?: string;
  target_company?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  domains?: Domain[];
  help_type?: HelpType;
}

export interface Offer {
  id: string;
  user_id: string;
  title: string;
  description: string;
  help_type_id: string;
  status: OfferStatus;
  opportunity_available: boolean;
  opportunity_title?: string;
  opportunity_company?: string;
  opportunity_link?: string;
  created_at: string;
  updated_at: string;
  domains?: Domain[];
  help_type?: HelpType;
}

export interface MatchResult {
  alum_id: string;
  full_name: string;
  avatar_url?: string | null;
  job_title?: string;
  company?: string;
  industry?: string;
  bio?: string;
  graduation_year?: number;
  last_active_at: string;
  offer_id: string;
  offer_title: string;
  offer_help_type_id: string;
  offer_help_type_name: string;
  d_score: number;
  h_score: number;
  c_score: number;
  r_score: number;
  total_score: number;
  matched_domains: { id: string; name: string; slug: string }[];
  remaining_capacity: number;
  monthly_limit: number;
  is_repeat_contact: boolean;
  brief?: string;
  factors?: {
    domainScore: number;
    helpTypeScore: number;
    capacityScore: number;
    recentActivityScore: number;
    totalScore: number;
  };
  scoreVersion?: string;
}

export interface ConnectionRequest {
  id: string;
  student_id: string;
  alum_id: string;
  intent_id: string;
  offer_id?: string;
  status: RequestStatus;
  student_message: string;
  repeat_contact_in_month: boolean;
  repeat_reason?: string;
  alumni_response_note?: string;
  idempotency_key?: string;
  expires_at: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
  alumnus?: Profile;
  intent?: Intent;
  offer?: Offer;
}

export interface Goal {
  id: string;
  request_id: string;
  student_id: string;
  alum_id: string;
  title: string;
  description: string;
  status: GoalStatus;
  student_confirmed_at?: string;
  alum_confirmed_at?: string;
  fulfilled_at?: string;
  created_at: string;
  updated_at: string;
  student?: Profile;
  alumnus?: Profile;
}

export interface Feedback {
  id: string;
  goal_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comments?: string;
  referral_status: ReferralStatus;
  is_flagged: boolean;
  created_at: string;
}

export interface TokenSummary {
  tokens_granted: number;
  tokens_spent: number;
  tokens_remaining: number;
  period_start: string;
}

export interface CapacitySummary {
  monthly_limit: number;
  reserved_count: number;
  processed_count: number;
  remaining_capacity: number;
  period_start: string;
}

export interface ProfileDomain {
  profile_id: string;
  domain_id: string;
  expertise_type?: "expertise" | "interest" | "primary" | "secondary";
  created_at?: string;
  domain?: Domain;
}

export interface MatchingConfig {
  id: string;
  version_name: string;
  is_active: boolean;
  weight_domain: number;
  weight_help_type: number;
  weight_capacity: number;
  weight_recency: number;
  recency_half_life_days: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenLedgerEntry {
  id: string;
  user_id: string;
  period_start: string;
  entry_type: "grant" | "spend" | "refund" | "adjustment";
  amount: number;
  request_id?: string;
  actor_id?: string;
  idempotency_key?: string;
  reason: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  payload?: Record<string, any>;
  read_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface ModerationReport {
  id: string;
  reporter_id: string;
  target_user_id?: string;
  target_type: "profile" | "intent" | "offer" | "message" | "goal";
  target_id?: string;
  reason: string;
  details?: string;
  status: "pending" | "reviewed" | "dismissed" | "actioned";
  created_at: string;
  updated_at: string;
}
