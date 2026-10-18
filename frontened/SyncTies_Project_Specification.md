# SyncTies — Complete Project Specification

**Product:** SyncTies  
**Tagline:** Right people. Right purpose. Real opportunities.  
**Document type:** Product requirements, technical design, matching algorithm, data model, API plan, and implementation roadmap  
**Status:** Proposed hackathon MVP with a clearly defined path to scale

---

## 1. Executive Summary

SyncTies is a goal-driven, AI-assisted alumni networking platform that helps students connect with relevant alumni for guidance, interview preparation, resume reviews, referrals, career direction, higher-education advice, and professional opportunities.

Traditional alumni directories act mainly as repositories of names and contact information. SyncTies is designed to help people discover **who is relevant to a specific goal, why the connection makes sense, whether the alumnus has review capacity, and what outcome resulted**.

The platform combines:

- Structured student goals and alumni offers.
- A deterministic, SQL-based weighted matching engine.
- Context-specific AI-generated “Why you should connect” briefs.
- Monthly student tokens and monthly alumni request-review capacity.
- Connection requests with anti-spam rules and transparent statuses.
- Goals with explicit progress and mutual completion confirmation.
- Feedback and reputation based on meaningful outcomes.
- An impact dashboard with transparent, computable metrics.

AI supports explanations; **SQL/business logic determines eligibility, scoring, token accounting, capacity, permissions, and outcomes**. This makes the MVP easier to test, explain, and evaluate.

## 2. Problem Statement

Students often cold-email many alumni without knowing whether the alumnus has the right expertise, can provide the requested help, or is available. This can be slow, stressful, and discouraging. Alumni may receive irrelevant or repetitive messages, making it difficult to identify serious requests. Institutions may have little visibility into whether alumni networking creates measurable value.

### Core problems

1. Students struggle to identify the right alumnus for a specific need.
2. Outreach is often generic and has low response rates.
3. Alumni can be overwhelmed by irrelevant or repeated requests.
4. There is no consistent way to track a connection’s purpose and outcome.
5. Institutions lack trustworthy measures of engagement and impact.

## 3. Product Goals

1. Replace undirected cold outreach with relevant, intent-based discovery.
2. Make each connection request specific, purposeful, and explainable.
3. Protect alumni from unlimited or irrelevant incoming requests.
4. Encourage students to spend outreach tokens thoughtfully.
5. Track progress from an open goal to a mutually confirmed outcome.
6. Recognize alumni who make a meaningful contribution.
7. Help administrators evaluate adoption, connection quality, and outcomes.
8. Keep the first release feasible for a hackathon team and extensible for future stakeholders.

### Non-goals for the initial MVP

- Building a custom machine-learning ranking model.
- Building a graph database or microservice architecture.
- Scraping external profile data or sending unsolicited bulk messages.
- Guaranteeing referrals, interviews, job offers, or outcomes.
- Claiming network distances or impact statistics that have not been computed from real data.
- Launching complex institution SSO before a supported identity provider is available.

## 4. Target Users and Pilot Scope

### Initial roles

**Student**
- Pilot eligibility: currently in the 3rd or 4th year of study.
- Creates goals/intents and chooses the type of help needed.
- Receives ranked alumni recommendations.
- Uses monthly tokens to request connections.
- Tracks goals and confirms fulfillment.
- Can provide feedback after an eligible completed goal.

**Alumnus**
- A working professional, initially prioritizing alumni from the most recent two or three graduating batches.
- Defines expertise, domains, help types, role/company context, available opportunities, and monthly request-review capacity.
- Receives relevant and capacity-aware requests.
- Accepts, declines, defers, or ignores a request.
- Works with students toward goals and confirms completion.
- Builds a professional reputation through genuine contribution and outcomes.

### Future stakeholder expansion

The data model and authorization approach should permit future onboarding of faculty/mentors, founders, recruiters, and institutional administrators. Do not expose unfinished workflows as if they are implemented in the MVP. The token/request logic can later be generalized to new stakeholder types.

### Pilot cohorts

- Students: 3rd- and 4th-year students.
- Alumni: professionals from the most recent two or three graduating batches, subject to actual participation and verification.
- Pilot cohort dates and token allowances should be configuration values, not hard-coded throughout the UI.

## 5. Main User Value

### For students

- Fewer cold emails and less stressful outreach.
- More relevant guidance, resume reviews, mock interviews, career guidance, referrals, and higher-education advice.
- A clear explanation of why an alumnus matches their need.
- Visible request status, token balance, and goal progress.

### For alumni

- Fewer irrelevant requests and clearer student intent.
- Capacity controls to set a manageable monthly review limit.
- Ability to identify repeat contact and decide whether to review it.
- Reputation and personal-brand benefits tied to meaningful help, not merely profile popularity.

### For institutions and the community

- Measurable engagement and goal outcomes.
- Insight into active domains, help types, and gaps in available mentoring capacity.
- Evidence-informed improvements to alumni engagement.

## 6. Core Feature Requirements

### 6.1 Authentication and onboarding

- Use Supabase Auth with email/password and Google OAuth where configured.
- Institution SSO is a future capability unless the selected institution provides a compatible provider and credentials.
- Do not treat Google login alone as proof of student or alumni status.
- During onboarding, capture role (student or alumnus), institution, graduation/expected graduation year, and role-specific fields.
- Add a verification status such as `unverified`, `pending`, `verified`, or `rejected`; protect access to restricted features based on verification policy.
- A user must not be able to create or edit another user’s profile by changing a client-side ID.
- Keep API credentials and privileged Supabase keys on the server only.

### 6.2 Profile and domain model

Profile fields may include:

- Name and profile image.
- Role: student or alumnus for MVP.
- Institution and cohort/graduation year.
- Student programme/year of study, where applicable.
- Alumni job title, company, industry, and professional summary.
- Expertise domains and skills.
- Help types the alumnus is willing to provide.
- Active opportunities or position tags when the alumnus has permission to share them.
- Profile completion and last-active timestamp.

Use a normalized domain taxonomy instead of relying entirely on free text. Initial domains can include Computer Science, Data Science, AI/ML, Web Development, Cybersecurity, Product Management, Finance, Consulting, Design, Research, Entrepreneurship, Marketing, Healthcare, and Other. Keep the taxonomy editable by authorized administrators.

### 6.3 Offers: what an alumnus can provide

An alumnus can publish one or more offers, with fields such as:

- Offer type: referral, mock interview, resume review, career/field guidance, higher-education guidance, portfolio review, project guidance, or other configured help type.
- Supported domains and role families.
- Short description and eligibility constraints.
- Whether an opportunity/position is currently available.
- Optional company, job-role, or opportunity tags.
- Status: draft, active, paused, closed.

Do not display confidential hiring information. Alumni must control what information is visible. Opportunity listings may be a lightweight MVP feature; a full job/application board can be added in a later phase.

### 6.4 Intents: what a student needs

A student creates an intent with:

- A goal title and short context.
- Help type requested.
- One or more professional domains.
- Optional target role, industry, or opportunity tags.
- Desired timeline/urgency, if used by the product.
- Status: open, in progress, fulfilled, closed.
- Visibility and creation/update timestamps.

Example: “Prepare for product management interviews” with domains `Product Management` and `Technology`, and help type `Mock Interview`.

Keep a free-text description for human context, but matching should use validated structured fields whenever possible. If AI is used to help turn text into structured tags, show the parsed result and let the student edit it before saving. Do not silently invent or persist inferred facts.

### 6.5 Matching and ranked discovery

- Query eligible alumni using SQL and normalized structured data.
- Filter out ineligible candidates before scoring.
- Score candidates using the weighted, deterministic formula described in Section 7.
- Show a score breakdown or concise explanation for transparency.
- Use tie-break rules that are stable and reproducible.
- Return a bounded, paginated list of candidates; do not fetch every user profile into the browser.
- AI must not calculate or override numeric ranking in the MVP.

### 6.6 AI “Why you should connect” brief

For a selected student intent and alumnus, generate a grounded two- or three-sentence explanation using only information that is available and permitted to be shown, such as:

- The student’s stated goal and help type.
- The alumnus’s declared domains, offers, role, and public profile summary.
- The overlap between the student’s structured requirements and alumnus’s structured offers.

Requirements:

- Generate on the server, never expose the model API key in the browser.
- Never invent credentials, employment history, availability, referral promises, or personal connections.
- Never include private contact details.
- Cache the result and reuse it when its input-version hash has not changed.
- Invalidate or regenerate the cache when relevant profile, offer, or intent fields change.
- If the model/API fails, show a deterministic template such as: “This alumnus lists experience in {domain} and offers {help_type}, which aligns with your goal of {goal}. Review their profile to decide whether to send a request.”
- If evidence is too weak, say that the fit is partial rather than overstating it.

### 6.7 Student monthly tokens

- Grant each eligible student a configurable fixed number of tokens each calendar month.
- A valid new connection request consumes one token.
- Display available, spent, and remaining tokens to the student.
- Maintain an auditable token ledger; do not rely solely on a mutable number in the browser.
- Monthly grants and request debits must be idempotent and atomic.
- Never deduct a token when the request fails validation or the transaction rolls back.
- Token allowance should be configurable for pilot evaluation.
- Token resets must be based on the chosen authoritative period/time-zone rule and consistently applied across SQL, API, and UI.

**Repeat-contact rule:**

- Block duplicate pending requests and duplicate active connection requests to the same alumnus for the same intent.
- If a student submits a new request to an alumnus after an earlier request to that alumnus during the same calendar month, mark it as a repeat contact and show a clear confirmation/warning before submission.
- Require a short reason for the repeat request, or another explicit justification chosen by the product team.
- A valid repeat submission still follows the token policy; it consumes a token only after all checks pass.
- Notify the alumnus that it is repeat contact. Give the alumnus a clear `Review` or `Ignore` action.
- Communicate the result to the student. An ignored repeat request should be marked as ignored and should not silently look pending forever.
- The repeat-contact flag is an anti-spam control; do not make a duplicate pending request possible merely because the client bypasses the UI.

### 6.8 Alumni monthly request-review capacity

- Alumni set the number of incoming requests they are willing to review per month.
- Show the alumnus the monthly limit, reserved/pending requests, reviewed requests, and remaining capacity.
- Candidates with no remaining capacity must not be returned as requestable matches.
- Capacity reservations must be handled atomically with request creation to prevent two simultaneous students taking the final slot.
- A capacity slot is reserved when a request enters the review queue.
- If a student withdraws before the alumnus reviews the request, release the reservation according to the product’s documented policy.
- Accepted, declined, or deliberately ignored requests count as processed/allocated review slots for that monthly capacity period. Keep reserved and processed values separate so the UI can be accurate.
- Capacity periods should use the same configured monthly-period convention as token periods.

### 6.9 Connection request lifecycle

Suggested request statuses:

`pending` → `accepted` | `declined` | `deferred` | `ignored` | `withdrawn` | `expired`

Rules:

- Only the target alumnus can accept, decline, defer, or ignore a request.
- Only the requester can withdraw a request, subject to status rules.
- A repeated request is clearly labeled.
- Status transitions are validated server-side.
- Notify both parties when relevant status changes occur.
- Never return private contact data before the policy allows it. The MVP can keep communication in-app or reveal mutually approved contact details after acceptance.
- Make request expiration configurable; a reasonable initial policy is to expire stale pending requests after a defined number of days, but the duration must be a configuration value.

### 6.10 Goals and progress tracking

Every valid request should have a clearly stated purpose. A goal can be created in `open` status and follows:

`open` → `in_progress` → `fulfilled`

An optional terminal `closed`/`cancelled` status may be used for a goal that will not proceed.

- Acceptance opens the collaboration; either participant can mark the goal as in progress according to transition rules.
- Participants can add progress notes or milestone updates, with appropriate privacy controls.
- A goal becomes `fulfilled` only after **both student and alumnus explicitly confirm** completion.
- Store each party’s confirmation timestamp separately.
- The second confirmation triggers one atomic transition to fulfilled and one outcome event. Repeated confirmation calls must not double-count fulfillment.
- If only one party confirms, display “Awaiting the other participant”; do not report fulfillment.
- Declined/ignored requests cannot have active fulfilled goals.

### 6.11 Feedback and reputation

After a goal is mutually fulfilled:

- The student may submit one rating, such as 1–5, plus optional comments about the support received.
- Prevent duplicate ratings for the same goal.
- Support moderation/reporting for abusive or privacy-violating feedback.
- Reputation should be outcome-oriented, not simply based on the number of profile views or matches.
- Useful alumni impact signals include mutually fulfilled goals, accepted connections, confirmed successful referrals (tracked separately), feedback score/count, and repeat participation.
- Do not treat a referral as successful merely because it was offered or a request was accepted. Record status explicitly: offered, submitted, interview, hired, unsuccessful, or unknown, as appropriate and voluntarily reported.
- Avoid unfairly penalizing alumni who have fewer opportunities to participate; display counts and context, not just a single opaque leaderboard score.

### 6.12 Impact dashboard

A protected `/dashboard` or `/impact` page should show real metrics computed from the database.

Recommended metrics:

1. Total accepted unique student–alumnus connections.
2. Intents posted.
3. Intents/goal conversion funnel: posted → requested → accepted → in progress → mutually fulfilled.
4. Weekly active users, with a documented event definition.
5. Average number of unique accepted connections per active user.
6. Top five network hubs by unique accepted connections (with privacy/role-appropriate visibility).
7. Connections by role pair and domain.
8. Goal fulfillment rate with denominator and date window shown.
9. Token usage: grants, requests created, failed attempts (never count failed attempts as spend), and remaining balances in aggregate.
10. Alumni capacity utilization.
11. A network connectivity score, if useful and clearly defined.

**Network connectivity score definition for the pilot:**

`Connectivity % = 100 × accepted unique student–alumnus pairs / possible eligible student–alumnus pairs`

For the simple pilot, `possible eligible pairs = number of active, verified students × number of active, verified alumni`, after excluding accounts that are not eligible for discovery. This measures pair coverage, not graph distance. Document the cohort and time window. Do not label it a universal networking score.

- “Within two connections of an industry professional” can only be shown if shortest-path graph distances are actually computed over a valid graph and the population/edge definition is documented. Do not infer it from the connectivity score.
- Clearly label mock/demo data as sample data.
- Use Recharts or comparable lightweight chart components.
- Enforce authorization so a standard user cannot read institution-wide private analytics unless permitted.

### 6.13 Notifications

In-app notifications are sufficient for MVP. Notify users about request creation, acceptance, decline, defer/ignore, repeat-contact review/ignore, goal progress, completion confirmation, mutual fulfillment, and feedback eligibility.

Notifications must be created from server-side state changes. Optional email delivery can be added after the core flow works. Do not use client-only notifications as the source of truth.

### 6.14 Opportunity exchange

The initial release should at least allow an alumnus to tag available roles, opportunities, or referral eligibility in their offers. A fuller opportunity board can be Phase 2:

- Opportunity title, company, role, description, domain, eligibility, location/remote status, closing date, owner, visibility, and status.
- Students may save or express interest and submit an application/introduction request.
- Track applications and outcomes without promising results.
- Only display opportunities the owner is authorized to share.

## 7. Detailed Matching Algorithm

### 7.1 Design principles

- Use SQL and deterministic business logic for matching and scoring.
- Keep matching explainable, testable, and easy to tune.
- Use AI for the natural-language connection brief only—not for score calculation or hidden ranking decisions.
- Start with straightforward domain tags and help types. Do not introduce embeddings, graph databases, or trained rankers into the MVP unless evaluation shows a clear need.
- Store score components for explanation/debugging where practical.
- Version the scoring formula so metric changes can be evaluated over time.

### 7.2 Matching flow

1. Authenticate the requester and validate that they are an eligible student.
2. Load the student’s active intent and structured required domains/help type.
3. Retrieve alumni profiles and active offers eligible for discovery.
4. Exclude candidates who are not discoverable, are the same user, are blocked/reported under a restrictive policy, have no active matching offer, have zero monthly review capacity, or have an incompatible/closed profile.
5. Exclude candidates with a duplicate pending or active request for the same student/intent.
6. Calculate each factor on a 0–100 scale.
7. Calculate the weighted total.
8. Apply a configurable minimum-score threshold if chosen; default behavior should favor returning the best true candidates rather than a fabricated number of matches.
9. Sort deterministically and apply pagination/diversity limits.
10. Return ranked matches with score breakdown and a data-grounded brief (generated lazily or in a batch for the top results).

### 7.3 Eligibility rules before score calculation

A candidate alumnus is eligible only when all applicable rules pass:

- Profile is active and verified according to pilot policy.
- Role is `alum` for the MVP matching path.
- At least one active offer matches a supported help type or configured compatibility rule.
- The alumnus has an active matching domain, or the product’s documented partial-match rule permits a domain-only candidate.
- The alumnus has remaining review capacity in the current capacity period.
- No blocked relationship or disallowed safety condition exists.
- The student and alumnus are different users.
- The student has an open active intent.
- No duplicate pending or active request exists for the same pair/intent.

If no eligible candidates remain, explain why in aggregate terms (for example, “No available alumni currently match these filters”). Do not reveal another person’s private capacity or profile data unnecessarily.

### 7.4 Weighted score

Each factor is normalized to `[0, 100]`.

`TotalScore = 0.40 × D + 0.30 × H + 0.20 × C + 0.10 × R`

Where:

- `D` = domain overlap score.
- `H` = help-type match score.
- `C` = available capacity score.
- `R` = recent activity score.

The total is between 0 and 100. Initial weights are product hypotheses and should be tuned from pilot evidence, not presented as proven optimal weights.

#### Factor D — Domain overlap (40%)

Let:

- `S` = canonical domain tags for the student’s selected intent.
- `A` = canonical domain tags from the alumnus’s active offers and declared expertise relevant to the requested help.

Use Jaccard similarity as the initial, symmetric measure:

`D = 100 × |S ∩ A| / |S ∪ A|`

Rules:

- Normalize tags to canonical domain IDs before comparison; avoid comparing arbitrary display labels.
- If either set is empty, return `0` rather than dividing by zero.
- Do not infer tags silently from a job title; an optional reviewed skill/domain extraction can be a separate feature.
- If the student has several intents/domains, score the intent selected for this match, not unrelated profile interests.
- If multiple offers exist, use the best applicable offer’s domain score or aggregate with a documented rule. Initial recommendation: use the maximum valid score among the alumnus’s active offers for the requested help type, and expose which offer supported the match.

Example: student domains `{Product Management, Technology, Startups}` and alumnus offer domains `{Product Management, Technology}` gives intersection size 2 and union size 3, so `D = 66.67`.

#### Factor H — Help-type match (30%)

Match the intent’s requested help type to the help types supported by the alumnus’s active offers.

Use a configurable compatibility table rather than fuzzy text comparisons. Initial values:

- Exact supported help type: `100`.
- Strong related help type explicitly configured by product/admin: `70`.
- Partial/adjacent help type: `40`.
- Unsupported help type: `0`.

Examples (only if approved in the compatibility table):

- Requested `Mock Interview` + offered `Mock Interview` → 100.
- Requested `Resume Review` + offered `Career Guidance` → possibly 70.
- Requested `Higher Education Guidance` + offered `Mock Interview` → 0.

Do not create compatibility relationships on the fly with an LLM. A help type should normally be an eligibility filter; the compatibility score supports exact and approved related types.

For multiple active offers, use the highest relevant help-type compatibility score among offers that are active and have capacity in the candidate’s monthly review pool.

#### Factor C — Available capacity (20%)

Let:

- `L` = alumnus’s monthly request-review limit for the current period.
- `U` = allocated slots in that period, including pending reservations and processed requests, according to the defined capacity policy.
- `Remaining = max(0, L − U)`.

Eligibility requires `Remaining > 0` and a valid limit.

`C = 100 × Remaining / L`

Clamp to `[0, 100]`. If `L <= 0`, the alumnus is ineligible. This is an availability signal, not a measure of professional quality. Keep the component visible so the team can assess whether this formula causes undesirable ranking behavior. A simpler binary capacity factor (100 when any capacity remains) can be A/B-tested if the ratio unfairly favors candidates with many slots.

#### Factor R — Recent activity (10%)

Use the server-maintained `last_active_at` timestamp, not a client-supplied value.

A simple, smooth decay with a 14-day half-life:

`R = 100 × 2 ^ (−age_days / 14)`

where `age_days = max(0, hours_since_last_active / 24)`.

Examples:

- Active today → close to 100.
- Active 14 days ago → 50.
- Active 28 days ago → 25.

Clamp to `[0, 100]`. If no activity timestamp exists, use `0` or a documented conservative default. Optionally exclude profiles inactive for a configurable period, such as 90 days, but do not conflate the exclusion rule with the recency score.

### 7.5 Worked example

Example component scores:

- `D = 80`
- `H = 100`
- `C = 50`
- `R = 75`

Calculation:

`TotalScore = 0.40(80) + 0.30(100) + 0.20(50) + 0.10(75)`  
`= 32 + 30 + 10 + 7.5 = 79.5 / 100`

Show `79.5%` or a rounded `80/100`, but use the unrounded score for sorting. Label it “Match score” rather than “probability of success”; it is a ranking score, not a statistically calibrated probability.

### 7.6 SQL implementation outline

Implement the production query in a PostgreSQL function/RPC or a well-tested SQL query. Derive the student ID from the authenticated session wherever possible; never trust a user ID supplied by the client without verifying ownership.

Illustrative pseudocode (adapt names/types to the final schema):

```sql
WITH student_need AS (
  SELECT i.id AS intent_id, i.user_id AS student_id, i.help_type_id
  FROM intents i
  WHERE i.id = p_intent_id
    AND i.user_id = auth.uid()
    AND i.status = 'open'
),
eligible_alumni AS (
  SELECT p.id AS alum_id, cap.monthly_limit, cap.allocated_count,
         p.last_active_at
  FROM profiles p
  JOIN alumni_capacity_monthly cap ON cap.user_id = p.id
  WHERE p.role = 'alum'
    AND p.is_active = true
    AND p.verification_status = 'verified'
    AND cap.period_start = date_trunc('month', CURRENT_DATE)::date
    AND cap.monthly_limit > cap.allocated_count
),
factor_scores AS (
  SELECT e.alum_id,
         /* D: Jaccard overlap × 100; handle empty sets explicitly */
         domain_overlap_score(student_need.intent_id, e.alum_id) AS d_score,
         /* H: configured help-type compatibility, 0–100 */
         help_type_score(student_need.intent_id, e.alum_id) AS h_score,
         /* C: remaining monthly capacity / monthly limit × 100 */
         100.0 * (e.monthly_limit - e.allocated_count)
           / NULLIF(e.monthly_limit, 0) AS c_score,
         /* R: activity decay with 14-day half-life */
         100.0 * POWER(2.0, -GREATEST(
           0, EXTRACT(EPOCH FROM (now() - e.last_active_at)) / 86400.0
         ) / 14.0) AS r_score
  FROM eligible_alumni e
  CROSS JOIN student_need
  WHERE NOT has_duplicate_or_active_request(student_need.student_id,
                                            e.alum_id,
                                            student_need.intent_id)
),
ranked AS (
  SELECT alum_id, d_score, h_score, c_score, r_score,
         0.40*d_score + 0.30*h_score + 0.20*c_score + 0.10*r_score
           AS total_score
  FROM factor_scores
)
SELECT * FROM ranked
ORDER BY total_score DESC, h_score DESC, c_score DESC, alum_id ASC
LIMIT p_limit OFFSET p_offset;
```

This is a design outline, not copy/paste-ready SQL: the helper functions, capacity schema, `last_active_at` null handling, permissions, and indexes must be implemented and tested. Prefer a single query or database function for consistent scoring and pagination. Keep the scoring weights and version in configuration/table metadata so future experiments can be measured.

### 7.7 Match diversity, tie-breaking, and fairness

- Primary order: total score descending.
- Tie-break 1: help-type score descending.
- Tie-break 2: remaining-capacity ratio descending, if the product team accepts this preference.
- Tie-break 3: recent activity timestamp descending.
- Final stable tie-break: ID ascending.
- Avoid showing the same alumnus on every student’s first result solely because they have many tags. For MVP, implement a simple per-page limit or optional exposure cap only if it can be applied transparently and does not break score explanations.
- Do not rank based on protected/sensitive attributes.
- Track impressions, requests, accepts, declines, and fulfilled goals to evaluate quality. Do not automatically alter weights from small or biased sample sizes.
- Evaluate offline with hand-created test cases before launch; compare high-scoring results with domain expert judgement during the pilot.

### 7.8 Matching evaluation metrics

Track and report:

- Eligible candidates per student intent.
- Top-5 precision from a manually reviewed pilot sample, if labels are collected.
- Match-to-request conversion: requests submitted / match cards viewed.
- Request acceptance rate: accepted / decided requests; report undecided separately.
- Goal fulfillment rate: mutually fulfilled goals / accepted connections eligible for outcome evaluation.
- Median time to first alumni response.
- Repeat-contact rate and ignore rate.
- Capacity utilization and no-capacity search rate.
- Distribution of match scores and component scores.

Do not claim that a score is accurate simply because the UI displays a percentage. The formula ranks candidates; the pilot determines whether those rankings are useful.

## 8. Main Screens and User Journeys

### Public and authentication

- Landing page: what SyncTies does, how it works, pilot scope, primary CTA.
- Sign-up/sign-in and verification states.
- Role-specific onboarding.

### Student experience

- Student dashboard: token balance, active intents, recommendations, pending requests, current goals.
- Profile editor: domains, skills, interests, institution, study year.
- Intent creation/editing.
- Ranked match discovery with score rationale and AI brief.
- Request confirmation, including repeat-contact warning when relevant.
- Request history/status.
- Goal detail, progress notes, confirmation and feedback.

### Alumni experience

- Alumni dashboard: request-review capacity, pending requests, active offers, ongoing goals, impact summary.
- Profile and offer editor.
- Monthly capacity control.
- Request inbox with student intent context, score rationale where appropriate, repeated-contact flag, and `Accept`, `Decline`, `Defer`, `Ignore` actions.
- Goal collaboration and fulfillment confirmation.
- Feedback/reputation summary.

### Institution/admin experience

- Protected aggregate impact dashboard.
- Manage domains, help types, compatibility matrix, cohort/eligibility rules, monthly token allowance, request expiration, and pilot configuration.
- Review reports/abuse and basic data-quality issues.
- Do not allow admins to silently rewrite individual user outcomes without an audit trail.

## 9. Recommended Technology Stack

Keep the stack small and integrated for a hackathon MVP.

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js App Router, React, TypeScript | UI, routing, server-rendered pages and forms |
| Styling/UI | Tailwind CSS, shadcn/ui, Lucide React | Responsive visual system and reusable components |
| Server API | Next.js Route Handlers / server actions where appropriate | Authenticated business operations |
| Database | Supabase PostgreSQL | Normalized data, SQL matching, transactional request logic |
| Auth | Supabase Auth | Email/password and Google OAuth; institution SSO later if available |
| File storage | Supabase Storage | Profile images and allowed attachments |
| AI | OpenAI API, server-side only | Contextual connection brief generation |
| Charts | Recharts | Impact dashboard visualizations |
| Validation | Zod and React Hook Form | Typed, validated input flows |
| Testing | Vitest and Playwright | Unit, integration, and key end-to-end tests |
| Deployment | Vercel + Supabase | Frontend/server deployment and managed backend |
| Version control | GitHub | Collaboration, review, and CI setup |

Do not add a separate Python API, Neo4j, Redis, vector database, or custom ML model to the initial release unless actual scale or measurement needs justify the added complexity. Database-based brief caching can be sufficient for the pilot.

## 10. Suggested System Architecture

```text
Student / Alumni Browser
        |
        v
Next.js UI (React + TypeScript + Tailwind)
        |
        v
Authenticated Next.js Route Handlers
        |--------------------|---------------------|
        v                    v                     v
Matching/Request        AI Brief Service       Dashboard Service
Business Logic          (OpenAI, cache,        (SQL aggregates)
                        grounded output)
        |                    |                     |
        +--------------------+---------------------+
                             |
                             v
                    Supabase PostgreSQL
          Profiles • Domains • Intents • Offers
          Requests • Tokens • Capacity • Goals
          Brief Cache • Feedback • Notifications
                             |
                             v
                     Supabase Auth / RLS
```

All privileged writes should be authorized server-side and/or in vetted database functions. Use Row Level Security (RLS) as defense in depth. RLS policies must be designed alongside the schema, not left until the end.

## 11. Data Model

Names below are suggested; adapt naming consistently and document the final schema in migrations.

### 11.1 `profiles`

- `id` UUID primary key referencing `auth.users(id)`.
- `full_name`, `avatar_url`, `role` (`student` or `alum` for MVP).
- `institution_id` or institution text/identifier.
- `study_year`, `expected_graduation_year`, `graduation_year` as applicable.
- `job_title`, `company`, `industry`, `bio` for alumni.
- `verification_status`, `is_active`, `last_active_at`.
- `profile_version` or `updated_at` for cache invalidation.
- `created_at`, `updated_at`.

### 11.2 `domains`

- `id`, `slug`, `name`, `is_active`, timestamps.
- Unique constraint on canonical `slug`.

### 11.3 `profile_domains`

- `profile_id`, `domain_id`, optional `proficiency_level` or `relevance`.
- Unique constraint on (`profile_id`, `domain_id`).

### 11.4 `help_types`

- `id`, `slug`, `name`, `is_active`.
- Initial types: referral, mock interview, resume review, career/field guidance, higher-education guidance, portfolio review, project guidance, other.

### 11.5 `help_type_compatibility`

- `requested_help_type_id`, `offered_help_type_id`, `score` from 0 to 100.
- Unique pair constraint.
- Only product/admin-managed, reviewed combinations.

### 11.6 `intents`

- `id`, `user_id`, `title`, `description`, `help_type_id`, `status`.
- Optional target role, opportunity tags, timeline, visibility.
- Domain links via `intent_domains`.
- `created_at`, `updated_at`, `closed_at`.
- Index by `user_id`, `status`, help type, and dates.

### 11.7 `offers`

- `id`, `user_id` (must be a verified/eligible alumnus in MVP), `title`, `description`, `help_type_id`, `status`.
- Optional role/company/opportunity tags and opportunity availability.
- Domain links via `offer_domains`.
- `created_at`, `updated_at`.

### 11.8 `intent_domains` and `offer_domains`

- Join tables linking intents/offers to canonical domain IDs.
- Unique constraint per pair.

### 11.9 `student_monthly_tokens`

- `user_id`, `period_start` (first day of calendar month), `tokens_granted`, `tokens_spent` or balance derived from ledger.
- Unique (`user_id`, `period_start`).
- A safer source-of-truth model is an immutable ledger plus a transactionally maintained summary row.

### 11.10 `token_ledger`

- `id`, `user_id`, `period_start`, `entry_type` (`grant`, `spend`, `refund`, `adjustment`), `amount` (define sign convention), `request_id` nullable, reason/metadata, `created_at`.
- Unique constraint preventing more than one token-spend entry per request.
- Ledger writes are server-side only; prevent clients from editing/deleting entries.

### 11.11 `alumni_capacity_monthly`

- `user_id`, `period_start`, `monthly_limit`, `reserved_count`, `processed_count`, `updated_at`.
- Unique (`user_id`, `period_start`).
- Maintain atomically, or derive and lock a summary row through a PostgreSQL function. Document precisely what consumes a capacity slot.

### 11.12 `connection_requests`

- `id`, `student_id`, `alum_id`, `intent_id`, `offer_id` optionally.
- `status`, `repeat_contact_in_month`, `repeat_reason`, `status_reason`.
- `created_at`, `updated_at`, `responded_at`, `expires_at`.
- `idempotency_key` or equivalent mechanism for retry safety.
- Indexes on student, alumnus, intent, status, and period-related request lookup.
- Use database constraints or transaction logic to prevent duplicate pending/active requests.

### 11.13 `goals`

- `id`, `request_id` unique, `title`, `description`, `status`.
- `student_confirmed_at`, `alum_confirmed_at`, `fulfilled_at`.
- `created_at`, `updated_at`.
- Only mutually confirmed goals can have `fulfilled_at` set.

### 11.14 `goal_updates` (optional but recommended)

- `id`, `goal_id`, `author_user_id`, `body`, `created_at`.
- Access limited to the goal participants and authorized admins where appropriate.

### 11.15 `connection_briefs`

- `id`, `student_id`, `alum_id`, `intent_id`, `offer_id` optionally.
- `input_hash` or profile/intent versions, `brief_text`, `model_id`, `created_at`, `updated_at`.
- Unique cache key for the same match inputs/version.
- Store generated content only after basic validation and grounding checks.

### 11.16 `feedback`

- `id`, `goal_id`, `reviewer_id`, `reviewee_id`, rating 1–5, optional comment, moderation status, `created_at`.
- Unique (`goal_id`, `reviewer_id`).
- Require goal eligibility and requester identity checks in server/database logic.

### 11.17 `notifications`

- `id`, `user_id`, type, title, body, related entity IDs, `read_at`, `created_at`.
- Only the recipient may mark their notification read.

### 11.18 `analytics_events`

- `id`, actor ID nullable where appropriate, event name, constrained metadata JSON, timestamp.
- Avoid storing unnecessary personal or sensitive text in analytics events.
- Define active-user calculations explicitly, e.g., a unique authenticated user with at least one meaningful product event in a rolling seven-day window.

### Optional Phase 2 tables

- `opportunities` and `applications` for a full opportunity board.
- `institutions` and institution memberships for multi-institution governance.
- `reports`/`moderation_actions` for trust and safety workflows.

## 12. API / Server Operation Plan

Prefer consistent, typed service functions called from server-only API routes. Validate all inputs with Zod or equivalent, enforce authorization, and return consistent errors.

| Method / Route | Purpose |
|---|---|
| `GET /api/profile` | Get current user profile |
| `PATCH /api/profile` | Update only allowed current-user profile fields |
| `GET /api/domains` | List active domains |
| `GET /api/help-types` | List supported help types |
| `GET /api/intents` | List current user’s intents |
| `POST /api/intents` | Create intent |
| `PATCH /api/intents/:id` | Update an owned intent |
| `GET /api/offers` | List current alumnus offers or authorized visible offers |
| `POST /api/offers` | Create offer |
| `PATCH /api/offers/:id` | Update an owned offer |
| `GET /api/matches?intentId=...` | Return SQL-scored, eligible, paginated matches |
| `GET /api/matches/:id/brief` | Get/generate cached connection brief for authorized match |
| `GET /api/tokens/balance` | Get current monthly balance and ledger summary |
| `POST /api/connection-requests` | Atomically debit token, reserve capacity, create request/goal, write ledger, and notify |
| `GET /api/connection-requests` | List current user’s received/sent requests |
| `PATCH /api/connection-requests/:id` | Perform an allowed state transition |
| `POST /api/connection-requests/:id/repeat-action` | Review/ignore a flagged repeat request if separate endpoint is preferred |
| `PATCH /api/capacity` | Update alumnus monthly review limit |
| `GET /api/goals/:id` | Get goal for a participant |
| `POST /api/goals/:id/updates` | Add a progress update |
| `POST /api/goals/:id/confirm` | Record current participant’s confirmation; complete only when both confirmed |
| `POST /api/feedback` | Add feedback for an eligible fulfilled goal |
| `GET /api/dashboard/metrics` | Return authorized aggregate metrics |
| `GET /api/notifications` | List current user’s notifications |
| `PATCH /api/notifications/:id` | Mark own notification read |

Exact route names can change; the security and transaction boundaries must not.

## 13. Atomic Connection-Request Transaction

Do not debit tokens or capacity from the client. Use a single PostgreSQL RPC/function or another real database transaction that performs these operations atomically:

1. Resolve the authenticated student identity and validate role/verification.
2. Confirm the intent belongs to the student and is open.
3. Validate that the alumnus is eligible and the selected offer is active.
4. Check for duplicate pending/active requests and enforce idempotency.
5. Calculate whether the request is repeat contact within the current month; validate repeat reason/confirmation policy.
6. Lock the student’s monthly token summary row (`SELECT ... FOR UPDATE`) or use an equivalent safe atomic update.
7. Verify the student has a token remaining.
8. Lock the alumnus’s monthly capacity row.
9. Verify a slot remains; reserve exactly one slot.
10. Deduct one token and write a corresponding immutable ledger entry.
11. Create the connection request and associated goal in the same transaction.
12. Write the in-app notification and analytics event after the state change is guaranteed, either transactionally or through a reliable outbox pattern.
13. Commit; on any failure, all token/capacity/request writes roll back.

Use database uniqueness constraints and idempotency to prevent double-charging on retries. A frontend disabled button is helpful UX but is not a concurrency-control mechanism.

## 14. Security, Privacy, and Reliability

- Enable RLS for all user-owned and private tables.
- Keep service-role keys and OpenAI credentials server-only.
- Do not allow clients to write token ledger, capacity summary, match-score fields, reputation aggregates, or fulfilled timestamps directly.
- Validate allowed request status transitions on the server/database.
- Ensure only the matching student and alumnus can access private request/goal detail.
- Ensure only the goal participants can confirm it.
- Avoid exposing private alumni capacity, contact details, raw token-ledger data, or other users’ private intents.
- Rate-limit authentication-sensitive or AI endpoints where feasible.
- Treat all profile text and intent descriptions as untrusted input, including possible prompt injection.
- Pass only the minimum necessary fields into the LLM prompt; instruct the model to ignore commands inside profile text and use it only as descriptive data.
- Validate AI response length/format and fall back safely.
- Use generic error messages for unauthorized objects so IDs cannot be enumerated.
- Add audit logging for administrative changes and important state transitions.
- Use safe file-upload types/sizes and storage policies.
- Provide account deletion/data retention behavior appropriate to the pilot.

## 15. Testing and Acceptance Criteria

### Matching tests

- Exact domain/help-type fit ranks above an otherwise equivalent partial fit.
- Domain Jaccard handles identical sets, partial overlap, no overlap, and empty sets.
- Unsupported help type is excluded or receives zero according to the eligibility policy.
- No-capacity alumnus is excluded before ranking.
- Recent activity changes `R` as specified and is calculated server-side.
- Total score stays in `[0,100]` and sorting uses unrounded scores.
- Tie-breaking is deterministic.
- AI brief failures do not change match ranking.

### Tokens and capacity tests

- Student with zero tokens cannot submit a request.
- Invalid/unauthorized requests do not consume tokens.
- A successful request consumes exactly one token.
- Two simultaneous requests using the student’s last token cannot both succeed.
- Two simultaneous requests for an alumnus’s last capacity slot cannot both reserve it.
- Retrying the same idempotent request cannot double-charge.
- Duplicate pending/active request is rejected.
- Repeat request in the same month is flagged and requires the documented confirmation/reason.
- Alumni review/ignore action is communicated to the student.
- Monthly rollover creates the correct period record without duplicating grants.

### Goal and feedback tests

- One confirmation does not fulfill a goal.
- Both participant confirmations fulfill exactly once.
- Unauthorized user cannot confirm a goal.
- Declined/ignored request cannot be fulfilled.
- Feedback cannot be submitted before eligible goal fulfillment.
- One reviewer cannot submit duplicate feedback for the same goal.

### Security tests

- Student cannot edit an alumnus profile or offer.
- User cannot read another user’s private intent or unrelated connection request.
- User cannot manipulate `role`, token balance, capacity, score, or reputation through arbitrary updates.
- Unauthenticated requests cannot reach protected business endpoints.
- OpenAI key is never exposed in client bundles.

### Dashboard tests

- Counts are calculated from source records, not hard-coded values.
- Denominators and date windows are documented.
- Demo data is explicitly labeled sample.
- The connectivity score uses the stated eligible-pair population.
- Non-admin users cannot see restricted institution-wide metrics.

### End-to-end acceptance flow

1. Student and alumnus create eligible profiles.
2. Alumnus creates an active offer and sets monthly capacity.
3. Student creates an intent.
4. Matching returns ranked eligible alumni with a score explanation.
5. A cached AI brief appears or a safe fallback is used.
6. Student submits a request; one token is debited and one capacity slot is reserved.
7. Alumnus receives a notification and accepts/declines/defers/ignores.
8. Both see the updated request state.
9. For an accepted request, the goal progresses and both participants confirm fulfillment.
10. Feedback eligibility and reputation metrics update once.
11. Dashboard reflects the real records.

## 16. Implementation Roadmap

### Phase 1 — Foundation

- Create Next.js TypeScript app and visual system.
- Configure Supabase project, environment variables, auth, and RLS.
- Create initial database migrations and seed canonical domains/help types.
- Implement student/alumnus onboarding and role-safe profiles.

### Phase 2 — Profile, intent, and offer workflows

- Build profile editing and verification state.
- Build structured intents and offers.
- Add domain/help-type pickers and server validation.
- Add dashboard shells for each role.

### Phase 3 — SQL matching

- Implement candidate eligibility query/function.
- Implement factor scores, weighted total, pagination, and tie-breaks.
- Add match cards with score breakdown.
- Seed realistic, explicitly fictional test data and automated matching tests.

### Phase 4 — Request, token, and capacity engine

- Implement monthly grants/ledger.
- Implement atomic request RPC, idempotency, duplicate rules, and capacity reservations.
- Implement alumni inbox and request state transitions.
- Add repeat-contact review/ignore behavior and notifications.

### Phase 5 — AI briefs and goal lifecycle

- Implement server-side brief generation, caching, grounding rules, and fallback.
- Build goal progress, mutual confirmation, and feedback flows.
- Add reputation aggregates based on confirmed outcomes.

### Phase 6 — Impact metrics and hardening

- Build dashboard and real aggregate queries.
- Add authorization checks, RLS review, concurrency tests, and end-to-end tests.
- Add loading, empty, error, expired-session, and responsive states.
- Deploy via Vercel and connect to Supabase production configuration.

### Phase 7 — Post-MVP expansion

- Opportunity board and application tracking.
- Institution-managed cohort controls and broader stakeholders.
- Enhanced verification/SSO.
- Offline match evaluation and measured weight tuning.
- Optional notifications by email and other supported channels.

## 17. Environment Configuration

Use an `.env.example` file with placeholder names only; never commit real credentials.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
STUDENT_MONTHLY_TOKEN_GRANT=5
MATCH_SCORE_VERSION=v1
MATCH_MIN_SCORE=0
REQUEST_EXPIRY_DAYS=14
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:

- The token grant, match threshold, model name, and expiry policy are configuration examples and should be tuned for the pilot.
- A service-role key should only be used in server-only code when necessary. Prefer the user-scoped Supabase client and RLS for normal requests.
- `STUDENT_MONTHLY_TOKEN_GRANT=5` is an example default, not a fixed product requirement.
- Keep local, preview, and production secrets separate.

## 18. Product Success Criteria

The MVP is successful if it can demonstrate the following with real test/pilot data:

- A student can express a goal in structured form.
- The SQL engine produces sensible, explainable ranked alumni matches.
- A match brief explains the fit without making unsupported claims.
- Token and capacity checks cannot be bypassed by simultaneous submissions.
- Repeat outreach is visible and handled transparently.
- Accepted connections have explicit goals and a mutual confirmation path.
- Alumni impact reflects meaningful outcomes rather than profile popularity alone.
- Metrics are reproducible from database records and labeled honestly.
- The complete app can be deployed and demonstrated reliably.

## 19. Important Product Decisions to Keep Explicit

These are configurable product choices and must not be buried in code:

1. Number of student tokens granted each month.
2. Monthly capacity limit and what counts as a consumed review slot.
3. Repeat-contact policy and required repeat reason.
4. Request expiration period.
5. Verification requirements for the pilot.
6. Exact help-type compatibility values.
7. Matching weights and score version.
8. Alumni inactivity cutoff, if any.
9. Who may view institution-wide analytics.
10. What constitutes a successful referral and which party may report it.
11. What profile data is public, institution-only, or visible only after acceptance.
12. Whether opportunity posting is MVP or Phase 2.

Keep these values in configuration or admin-managed tables when feasible, document changes, and use pilot results before tuning them.

---

## Appendix A — Concise Product Pitch

**SyncTies turns alumni networking from a directory into an outcome-driven connection system.** Students set a goal, SQL ranks eligible alumni by domain fit, help-type compatibility, remaining capacity, and recent activity, and AI explains why a connection may be relevant. Monthly tokens encourage thoughtful outreach, alumni capacity controls reduce spam, and mutual goal confirmation plus an impact dashboard help the community learn which connections create value.

## Appendix B — Simple End-to-End Flow

```text
Student / Alumni Sign-up
          |
          v
Role-safe Profile + Verification
          |
          +-------------------------------+
          |                               |
          v                               v
Student Intent                    Alumni Offer + Capacity
          |                               |
          +---------------+---------------+
                          v
                 SQL Eligibility Filters
                          |
                          v
                 Weighted Match Scores
             40%D + 30%H + 20%C + 10%R
                          |
                          v
               Ranked Match Cards + Brief
                          |
                          v
            Student confirms request + token
                          |
                          v
          Atomic token debit + capacity reserve
                          |
                          v
                Alumni reviews request
                          |
                          v
            Accepted → Goal collaboration
                          |
                          v
             Both confirm goal fulfillment
                          |
                          v
          Feedback + reputation + analytics
```
