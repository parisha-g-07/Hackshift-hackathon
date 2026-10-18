# SyncTies — AI-Assisted Alumni Networking Platform

SyncTies is an outcome-driven, AI-assisted alumni networking platform designed to connect **3rd and 4th-year university students** with recent **working alumni** (graduating classes 2022–2026). Unlike open-ended directories or spammy messaging platforms, SyncTies is built around structured student intents, active alumni mentorship offers, monthly review capacities, and financial-like token rules.

---

## 🏛️ Core Product Principles

1. **Deterministic Matching:** Matching is computed strictly via PostgreSQL SQL and deterministic algorithms ($0.40 \cdot D + 0.30 \cdot H + 0.20 \cdot C + 0.10 \cdot R$). No LLM ever scores, filters, or ranks users.
2. **AI Explains; It Does Not Decide:** OpenAI generates concise, grounded 2–3 sentence "Why you should connect" briefs strictly using verified profile, intent, and offer facts. It never invents qualifications, openings, or guarantees.
3. **No Client-Side Trust:** All token debits, capacity reservations, permissions, status transitions, confirmation timestamps, and reputation aggregates are validated and enforced on the server and database.
4. **Atomic Financial-Like Operations:** Student token debits, alumni capacity reservations, request creations, and ledger records execute together in an atomic PostgreSQL transaction (`SELECT ... FOR UPDATE`) or roll back together.
5. **Mutual Goal Completion:** A goal room is marked `fulfilled` only after **both** the student and the alumnus have explicitly confirmed completion.
6. **Honest Metrics:** All figures on the `/impact` analytics dashboard derive directly from database aggregates. Demo seed datasets are visibly flagged with an explicit sample data notice.
7. **Privacy by Default:** Direct contact info (email/phone) is concealed until a connection request is explicitly accepted and permission is granted.
8. **Fail Gracefully:** Missing OpenAI API keys fall back cleanly to deterministic briefs without breaking match cards. Missing Supabase configurations show actionable setup guidance and seamlessly activate an in-memory pilot mode.

---

## 📐 Deterministic Matching Algorithm

The matching engine computes a composite score $\in [0, 100]$:

$$\text{Total Score} = 0.40 \cdot D + 0.30 \cdot H + 0.20 \cdot C + 0.10 \cdot R$$

### Factor Definitions

| Factor | Name | Weight | Calculation Method |
|---|---|---|---|
| **$D$** | Domain Overlap | 40% | **Jaccard similarity** between the student's requested intent domains and the alumnus's offer domains: $\frac{\|D_{\text{intent}} \cap D_{\text{offer}}\|}{\|D_{\text{intent}} \cup D_{\text{offer}}\|} \times 100$ |
| **$H$** | Help Type Compatibility | 30% | Compatibility matrix score from database (`100` for exact match, `70` for related pairings e.g. mock interview $\leftrightarrow$ career guidance, `40` for loosely related, `0` for incompatible) |
| **$C$** | Capacity Availability | 20% | Normalized available slots this calendar month: $\min(100, 100 \times \frac{\text{remaining}}{\text{monthly\_limit}})$. Alumni with `0` remaining capacity are excluded from candidate pools |
| **$R$** | Recency Score | 10% | Exponential decay with a **14-day half-life** ($\lambda = \frac{\ln(2)}{14}$): $100 \times \exp(-\lambda \times \Delta t_{\text{days}})$ based on alumnus's last activity |

### Stable Tie-Breaking
When candidates yield equal total scores, results are deterministically ordered by:
1. `total_score DESC`
2. `c_score DESC` (higher available capacity prioritized)
3. `r_score DESC` (more recently active alumnus prioritized)
4. `offer_id ASC` (stable primary key ordering)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI:** Tailwind CSS v4, Lucide React icons, shadcn-inspired component primitives
- **Database & Auth:** Supabase PostgreSQL with Row-Level Security (RLS) and stored procedures (RPC)
- **AI Integration:** OpenAI API (`gpt-4o-mini`) with SHA-256 cache hashing and deterministic fallback
- **Visualizations:** Recharts (Funnel progression, domain breakdown, capacity utilization)
- **Validation:** Zod schemas on all API Route Handlers
- **Testing:** Vitest (53 passing tests across matching, lifecycle, concurrency, briefs, and API routes)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18.18.0 or higher
- **npm:** v9.0.0 or higher

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-org/syncties.git
cd syncties
npm install
```

### 3. Environment Setup
Copy the sample environment file:
```bash
cp .env.example .env.local
```

SyncTies operates in **two modes**:
- **Standalone Demo Mode (Default):** Runs immediately with realistic pre-seeded pilot data (14 domains, 8 help types, mock student & alumni profiles, active intents and offers). No external accounts needed.
- **Production Supabase Mode:** Connects to a live Supabase PostgreSQL instance.

Configure `.env.local`:
```ini
# Supabase Configuration (Leave blank for standalone in-memory mode)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional OpenAI API Key (Leave blank to use deterministic AI fallback briefs)
OPENAI_API_KEY=sk-...

# Platform Pilot Rules
STUDENT_MONTHLY_TOKEN_GRANT=5
REQUEST_EXPIRY_DAYS=14
MATCH_SCORE_VERSION=v1
```

### 4. Running the App
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests & Build Verification

Run the complete Vitest test suite:
```bash
npm test
```
*Current test suite: 6 test files, 53 assertions, 100% passing in ~650ms:*
- `tests/sanity.test.ts`: Environment and test runner sanity check.
- `tests/matching.test.ts`: 21 tests covering Jaccard overlap, help-type compatibility, capacity normalization, 14-day exponential decay, composite weighting, and tie-breaking.
- `tests/lifecycle.test.ts`: 12 tests covering request state transitions (`pending` $\rightarrow$ `accepted`/`declined`/`deferred`/`ignored`), dual goal confirmation, and feedback guardrails.
- `tests/tokens_and_capacity.test.ts`: 7 tests verifying atomic debit, capacity reservation, concurrent last-token race conditions, idempotency keys, duplicate request prevention, and repeat-contact justifications.
- `tests/brief.test.ts`: 4 tests for AI connection brief generation, cache keys, and deterministic offline fallbacks.
- `tests/api_routes.test.ts`: 8 tests validating Next.js Route Handlers (`/api/health`, `/api/domains`, `/api/help-types`, `/api/intents`, `/api/matches`, `/api/tokens/balance`, `/api/capacity`, `/api/dashboard/metrics`).

Verify the production build:
```bash
npm run build
```

---

## 🗄️ Database Migrations (Supabase)

To deploy to a live Supabase project, execute the SQL migration scripts in `supabase/migrations/` in sequential order using the Supabase Dashboard **SQL Editor**:

1. **`supabase/migrations/001_schema.sql`**
   - Creates 19 normalized tables: `profiles`, `domains`, `help_types`, `help_type_compatibility`, `intents`, `intent_domains`, `offers`, `offer_domains`, `student_monthly_tokens`, `token_ledger`, `alumni_capacity_monthly`, `connection_requests`, `goals`, `goal_updates`, `connection_briefs`, `feedback`, `notifications`, `analytics_events`.
   - Defines strict enum types, foreign keys with cascade constraints, check constraints, and performance indexes.
2. **`supabase/migrations/002_rls.sql`**
   - Enables Row-Level Security on all tables.
   - Restricts intent/offer editing to creators.
   - Hides private email and phone info from unrelated users.
   - Enforces participant-only access on connection requests, goals, and feedback.
3. **`supabase/migrations/003_seed.sql`**
   - Seeds 14 canonical professional domains (Computer Science, AI/ML, FinTech, Product Management, etc.).
   - Seeds 8 canonical help types (Referral, Mock Interview, Resume Review, Career Guidance, etc.).
   - Establishes the full compatibility weight matrix.
4. **`supabase/migrations/004_rpc.sql`**
   - `score_matches_for_intent(...)`: Pure SQL deterministic scoring function calculating Jaccard similarity, help type compatibility, capacity scores, and exponential recency decay.
   - `create_connection_request_atomic(...)`: Stored procedure executing row-level locks (`SELECT ... FOR UPDATE`), debiting student tokens, reserving alumni review slots, checking idempotency, and recording ledger entries.
   - `confirm_goal_completion(...)`: Atomic goal completion function verifying dual confirmation (both student and alumnus) before transitioning status to `fulfilled`.

---

## 🧭 Page Routes & Site Map

| Route | Role | Description |
|---|---|---|
| `/` | Public | Landing page explaining the SyncTies matching formula, pilot cohort governance, and student/alumni outcomes. |
| `/auth/sign-in` | Public | Email and magic link sign-in with clear demo credential assistance. |
| `/auth/sign-up` | Public | Student and alumni registration. |
| `/onboarding` | Authenticated | Role selection, graduation cohort (2022–2026), university verification, and domain expertise setup. |
| `/student/dashboard` | Student | Monthly token balance tracker, active intents overview, suggested matches, outgoing request statuses, and active goals. |
| `/student/intents` | Student | Management of active and past learning/mentorship intents. |
| `/student/intents/new` | Student | Multi-step form to publish a new structured intent with domain tags and target timelines. |
| `/student/matches?intentId=...` | Student | Ranked alumni matches with granular score factor breakdown ($D$, $H$, $C$, $R$), "Why you should connect" AI briefs, and connection request triggers. |
| `/student/requests` | Student | Outgoing request tracker with status badges and repeat-contact justification prompts. |
| `/alumni/dashboard` | Alumnus | Monthly review capacity utilization, published offers, pending request inbox, active goal collaborations, and impact badges. |
| `/alumni/offers` | Alumnus | Create, edit, pause, and close mentorship offers and active job openings. |
| `/alumni/requests` | Alumnus | Incoming request review with one-click **Accept**, **Decline**, **Defer**, and **Ignore** actions. |
| `/goals/[id]` | Both | Goal collaboration room featuring progress milestones, activity updates, dual completion confirmation, and post-fulfillment feedback. |
| `/profile` | Current User | Editable user profile, privacy settings, and cohort verification details. |
| `/impact` | Public / Admin | Aggregated platform metrics: network connectivity index, goal fulfillment rate, capacity utilization, and domain distributions. |

---

---

## 🔐 Supabase Auth & Social Provider Configuration

SyncTies supports three production authentication methods with zero institutional domain barriers:
1. **Email & Password** (any valid email domain accepted; email confirmation supported).
2. **Google OAuth** via Supabase Auth.
3. **LinkedIn OAuth** via Supabase OpenID Connect (`linkedin_oidc`).

OAuth client secrets are stored strictly within the Supabase Dashboard and never exposed in browser code or `NEXT_PUBLIC_*` variables.

### 1. Email & Password Configuration
- In your **Supabase Dashboard** -> **Authentication** -> **Providers** -> **Email**:
  - Enable **Email** provider.
  - Set **Confirm email** to `On` (recommended for production) or `Off` (for instant registration).
  - SyncTies handles sign-up, sign-in, sign-out, forgot password, reset password, and resend confirmation out of the box.

### 2. Google OAuth Configuration
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a Google Cloud project and go to **APIs & Services** -> **Credentials**.
3. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
4. In your Supabase Dashboard, go to **Authentication** -> **Providers** -> **Google**.
5. Copy the **Callback URL (for OAuth)** provided by Supabase (format: `https://<your-project-ref>.supabase.co/auth/v1/callback`).
6. In Google Cloud Console, paste this URL into **Authorized redirect URIs**.
7. Copy the **Client ID** and **Client Secret** from Google into Supabase Auth Google provider settings, and toggle **Enable Sign in with Google**.
8. References: [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

### 3. LinkedIn (OpenID Connect) Configuration
1. Open the [LinkedIn Developer Portal](https://www.linkedin.com/developers/).
2. Create or select your LinkedIn App.
3. Under the **Products** tab, request access to **Sign In with LinkedIn using OpenID Connect** (grants `openid`, `profile`, `email` scopes).
4. In the **Auth** tab, locate **Authorized redirect URLs for your app**.
5. Copy the **Callback URL (for OAuth)** provided by Supabase (format: `https://<your-project-ref>.supabase.co/auth/v1/callback`).
6. Add this exact Supabase callback URL to the LinkedIn Authorized redirect URLs list.
7. In your Supabase Dashboard, navigate to **Authentication** -> **Providers** -> **LinkedIn (OIDC)**:
   - Note: Strictly use the modern **LinkedIn (OIDC)** provider (provider ID: `linkedin_oidc`).
   - Enter your LinkedIn **Client ID** and **Client Secret**.
   - Toggle **Enable LinkedIn (OIDC)**.
8. References: [Supabase LinkedIn OIDC Guide](https://supabase.com/docs/guides/auth/social-login/auth-linkedin)

### 4. Application Redirect Allowlist (Supabase Settings)
In your Supabase Dashboard under **Authentication** -> **URL Configuration**:
- **Site URL:** `http://localhost:3000` (or your production domain e.g. `https://syncties.app`)
- **Redirect URLs:** Add both local and production callback destinations:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/reset-password`
  - `https://your-production-domain.com/auth/callback`
  - `https://your-production-domain.com/auth/reset-password`

---

## 🔒 Security & Privacy Guarantees

- **No Client Trust for State:** Token deductions, capacity limits, and status updates are executed exclusively via authenticated server Route Handlers or PostgreSQL stored procedures.
- **Contact Privacy:** Contact info is never revealed on match cards or search results. It is only shared within the private `/goals/[id]` room once an alumnus accepts a request.
- **Concurrency Protection:** In-flight concurrent requests for the final remaining token or final capacity slot are serialized via row locks (`FOR UPDATE`), preventing double-spending or overselling.
- **Idempotency Protection:** All connection request submissions support idempotency keys to ensure network retries do not debit multiple tokens.

---

## ☁️ Deployment Guide (Vercel)

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), import the repository.
3. Configure the **Environment Variables** in project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY` (optional)
   - `STUDENT_MONTHLY_TOKEN_GRANT=5`
   - `REQUEST_EXPIRY_DAYS=14`
   - `MATCH_SCORE_VERSION=v1`
4. Click **Deploy**. Vercel will execute `npm run build` and provision the Next.js App Router edge and serverless runtime.
5. Apply the Supabase SQL migrations from `supabase/migrations/` on your production Supabase database.

---

## 📄 License
MIT License. Built for university pilot programs.
