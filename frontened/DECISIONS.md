# SyncTies — Technical Decisions

## D001: Framework & Stack
**Decision:** Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui + Supabase
**Reason:** Matches spec requirements. App Router for server components and route handlers.
Server-side business logic via Route Handlers keeps secrets safe.

## D002: Database
**Decision:** Supabase PostgreSQL with SQL migrations
**Reason:** Spec requires PostgreSQL for deterministic matching. Supabase provides managed Postgres + Auth + RLS.

## D003: Matching is pure SQL
**Decision:** All scoring/ranking in PostgreSQL. No LLM involvement in ranking.
**Reason:** Core product principle #1. Formula: 0.40*D + 0.30*H + 0.20*C + 0.10*R

## D004: Token/Capacity atomicity
**Decision:** PostgreSQL RPC function with SELECT FOR UPDATE for atomic request creation.
**Reason:** Core product principle #4. Prevents double-spending via row locks.

## D005: AI briefs are optional
**Decision:** OpenAI generates briefs server-side, cached in DB. Deterministic fallback when key missing.
**Reason:** Core product principle #2 and #8. AI explains, doesn't decide. Missing key can't break app.

## D006: Supabase client architecture
**Decision:** Two clients — `createBrowserClient` for client components, `createServerClient` for server components/route handlers using cookies.
**Reason:** Supabase SSR pattern. Service role key only in server-side code when needed for admin operations.

## D007: Testing
**Decision:** Vitest for unit/integration tests. Score functions are pure and testable without DB.
**Reason:** Fast feedback loop. Matching logic is the most critical code path.

## D008: Monorepo-free
**Decision:** Single Next.js app, no monorepo/turborepo/microservices.
**Reason:** Spec explicitly says no microservices. Simplest maintainable structure.

## D009: Next.js 16 Proxy Migration
**Decision:** Implement routing interceptors in `proxy.ts` exporting `proxy` rather than deprecated `middleware.ts`.
**Reason:** Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`. Adhering to the latest convention avoids runtime build warnings.

## D010: Standalone In-Memory Seed Mode for Graceful Degradation
**Decision:** If Supabase credentials are not present in `.env.local`, Route Handlers and client components seamlessly operate using an in-memory seed dataset in `lib/data/store.ts` and display a clear `ConfigBanner`.
**Reason:** Satisfies Core Product Principle #8 ("Fail gracefully. Missing Supabase configuration must show clear setup instructions, not an unexplained runtime crash"). Allows instant local evaluation and testing without mandatory cloud provisioning.

## D011: Mutual Goal Completion & Dual Confirmation
**Decision:** Goal fulfillment strictly requires two independent confirmation timestamps (`student_confirmed_at` and `alum_confirmed_at`). Feedback submission is blocked at the database level and API layer until status is `fulfilled`.
**Reason:** Enforces Core Product Principle #5 ("Mutual goal completion. A goal is fulfilled only after both student and alumnus confirm").

## D012: 36-Character Hex UUID Schema Validation
**Decision:** Validate UUID parameters using `/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/` regex instead of strict RFC 4122 variant checking.
**Reason:** PostgreSQL `uuid` type accepts all 128-bit hexadecimal strings with hyphens. Using standard hex validation accommodates both random v4 UUIDs and canonical seed identifiers without schema errors.

## D013: Named Matching Weights Configuration
**Decision:** All algorithm weights (0.40 D, 0.30 H, 0.20 C, 0.10 R) and half-life parameters (14 days) are defined in a single named configuration `MATCHING_WEIGHTS_V1` in `lib/matching/score.ts` and mirrored in SQL declarations in `supabase/migrations/004_rpc.sql`.
**Reason:** Prevents fragmented weight constants across the codebase and establishes a clean mechanism to tune weights following pilot evaluation.

## D014: Capacity Preservation & Withdrawal Refunds
**Decision:** A student withdrawal of a pending request before alumnus review releases the reserved review slot and refunds the student token. Conversely, processed outcomes (accepted, declined, ignored) remain permanently counted against that month's capacity limit.
**Reason:** Satisfies Section B.4 rules preventing arbitrary capacity decrementing while ensuring alumni review quotas accurately reflect work conducted.

## D015: Authentication Architecture — Non-College Email, Google OAuth & LinkedIn OIDC
**Decision:** Replace all college email restrictions, domain allowlists, and institution SSO with three core authentication methods:
1. Standard Email & Password (any valid email domain accepted; confirmation, password recovery, and resend flows fully supported).
2. Google OAuth via Supabase Auth (`provider: 'google'`).
3. LinkedIn OAuth via Supabase's OpenID Connect provider (`provider: 'linkedin_oidc'`, strictly avoiding the deprecated `linkedin` provider identifier).
**Reason:**
- College-only email requirements create high friction for recent working alumni who no longer access university inboxes, as well as students with personal accounts.
- Institution SSO introduces fragile external IT dependencies incompatible with rapid cross-university pilots.
- OAuth client secrets are strictly maintained in provider configuration / Supabase dashboard and never exposed in browser JavaScript or `NEXT_PUBLIC_*` environment variables.
- Profile mapping maintains strictly 1 `profiles` row per `auth.users.id` (enforced via database trigger `handle_new_user()` and upsert logic). Accounts are never silently merged across distinct `auth.users.id` by raw email strings.
- Mandatory `verification_status = 'verified'` gating is eliminated from matching queries and request creation; accounts remain gated by `is_active = true` and role permissions while institution, study year, and company remain self-reported attributes.
