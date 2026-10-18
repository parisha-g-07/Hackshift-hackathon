"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Sparkles,
  Zap,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Shield,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { PortalShell } from "@/components/layout/portal-shell";
import { MatchResult, TokenSummary } from "@/types/database";

function MatchesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intentId = searchParams.get("intentId");

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [tokens, setTokens] = useState<TokenSummary | null>(null);
  const [intent, setIntent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Drawer state for "Why this match?"
  const [activeDrawerMatch, setActiveDrawerMatch] = useState<MatchResult | null>(null);

  // Request modal state
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [studentMessage, setStudentMessage] = useState("");
  const [repeatReason, setRepeatReason] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  useEffect(() => {
    const url = intentId ? `/api/matches?intentId=${intentId}` : "/api/matches";

    Promise.all([
      fetch(url).then((r) => r.json()),
      fetch("/api/tokens/balance").then((r) => r.json()),
    ])
      .then(([matchData, tokenData]) => {
        if (matchData?.matches) setMatches(matchData.matches);
        if (matchData?.intent) setIntent(matchData.intent);
        if (tokenData) setTokens(tokenData);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [intentId]);

  const handleOpenRequestModal = (match: MatchResult) => {
    setActiveDrawerMatch(null);
    setSelectedMatch(match);
    setRequestError(null);
    setRequestSuccess(null);
    setStudentMessage(
      `Hi ${match.full_name}, I saw your offer "${match.offer_title}" and would value your guidance on my goal.`
    );
    setRepeatReason("");
  };

  const handleSendRequest = async () => {
    if (!selectedMatch || !intentId) return;

    setRequestLoading(true);
    setRequestError(null);

    try {
      const res = await fetch("/api/connection-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alum_id: selectedMatch.alum_id,
          intent_id: intentId,
          offer_id: selectedMatch.offer_id,
          student_message: studentMessage,
          repeat_reason: selectedMatch.is_repeat_contact ? repeatReason : undefined,
          idempotency_key: crypto.randomUUID(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit connection request");
      }

      // Update tokens count locally
      if (tokens) {
        setTokens({
          ...tokens,
          tokens_spent: tokens.tokens_spent + 1,
          tokens_remaining: Math.max(0, tokens.tokens_remaining - 1),
        });
      }

      setRequestSuccess("Connection request sent successfully! 1 token debited.");
      setTimeout(() => {
        setSelectedMatch(null);
        router.push("/student/requests");
      }, 1500);
    } catch (err: any) {
      setRequestError(err?.message || "Failed to send request");
    } finally {
      setRequestLoading(false);
    }
  };

  if (!intentId) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <EmptyState
          icon={Users}
          title="No intent selected"
          description="Select an active intent from your dashboard to view transparent alumni recommendations."
          actionLabel="View Dashboard"
          actionHref="/student/dashboard"
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-page-enter">
      {/* Top Breadcrumb & Token Balance Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#edf0f5] pb-6">
        <div>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66758e] hover:text-[#15213b] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl text-[#15213b]">
            Ranked Alumni Matches
          </h1>
          <p className="text-sm text-[#66758e] mt-1">
            Explainable ranking: 40% Domain Overlap + 30% Help-Type Fit + 20% Capacity + 10% Recency
          </p>
        </div>

        {/* Token Balance Pill */}
        <div className="inline-flex items-center gap-3 bg-white border border-[#e5eaf2] rounded-xl px-4 py-2.5 shadow-xs">
          <div className="h-9 w-9 rounded-lg bg-[#edf1ff] text-[#3563ff] flex items-center justify-center font-bold">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-[#8896ab] font-medium">Monthly Token Balance</div>
            <div className="text-base font-extrabold text-[#15213b] leading-tight font-heading">
              {tokens?.tokens_remaining ?? 4}{" "}
              <span className="text-xs font-normal text-[#8896ab]">
                / {tokens?.tokens_granted ?? 5} remaining
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Context Banner */}
      {intent && (
        <div className="goal-banner">
          <span>
            <Sparkles className="h-5 w-5 text-[#536df0]" />
          </span>
          <div>
            <small className="text-xs text-[#8896ab] uppercase tracking-wider font-semibold">Matching for intent:</small>
            <b className="text-base text-[#15213b] font-bold">{intent.title}</b>
          </div>
          <Badge tone="soft">{intent.help_type?.name || "Career Guidance"}</Badge>
          <Link href={`/student/intents`}>
            <button className="text-xs font-semibold text-[#5369e8] hover:underline flex items-center gap-1">
              Switch Intent <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
        </div>
      )}

      {/* Results Header */}
      <div className="results-head">
        <p className="text-sm text-[#15213b]">
          <b>{matches.length} mentors</b> aligned with your goal
        </p>
        <small className="text-xs text-[#8896ab]">
          Scores indicate algorithmic relevance, not candidate quality or guaranteed outcomes.
        </small>
      </div>

      {/* Match Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-[#f0f3f8] animate-pulse" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No eligible alumni matches found"
          description="None of our active alumni currently have open review capacity matching this specific domain and help type."
          actionLabel="Edit Goal Tags"
          actionHref="/student/intents"
        />
      ) : (
        <div className="match-grid">
          {matches.map((m, idx) => {
            const initials = m.full_name
              ? m.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
              : "AL";
            const tones = ["violet", "cyan", "coral", "blue"] as const;
            const tone = tones[idx % tones.length];

            return (
              <article key={m.alum_id} className="match-card">
                {/* Card Top Row: Person Info on Left, Score Orb on Right */}
                <div className="card-top">
                  <div className="person">
                    <Avatar initials={initials} tone={tone} size="md" />
                    <div className="person-info">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-[#15213b] text-base leading-snug">{m.full_name}</h3>
                        <span className="badge soft text-[10px] py-0.5 px-1.5 inline-flex items-center gap-1 font-semibold text-[#4d5fd3]">
                          <Sparkles className="h-2.5 w-2.5" /> Mentor
                        </span>
                      </div>
                      <p className="text-xs text-[#66758e] mt-0.5">
                        {m.job_title} · {m.company}
                      </p>
                      <span className="text-[11px] text-[#8896ab]">
                        Class of {m.graduation_year || 2023}
                      </span>
                    </div>
                  </div>

                  <div
                    className="score-orb"
                    style={{
                      background: `conic-gradient(#536df0 ${m.total_score}%, #e4e9f2 0)`,
                    }}
                  >
                    <span>{m.total_score}</span>
                    <small>match</small>
                  </div>
                </div>

                {/* Offer & Domain Tags */}
                <div className="tags">
                  <Badge tone="soft">{m.offer_title}</Badge>
                  {m.industry && <Badge>{m.industry}</Badge>}
                  {m.is_repeat_contact && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Repeat
                    </span>
                  )}
                </div>

                {/* Capacity Status */}
                <div className="capacity">
                  <i className={m.remaining_capacity > 0 ? "" : "warn"} />
                  <span>
                    {m.remaining_capacity > 0
                      ? `${m.remaining_capacity} of ${m.monthly_limit} reviews open this month`
                      : "Monthly capacity reached"}
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="card-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setActiveDrawerMatch(m)}
                    className="text-xs h-9 min-h-0 w-full"
                  >
                    Why this match?
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleOpenRequestModal(m)}
                    disabled={m.remaining_capacity <= 0}
                    className="text-xs h-9 min-h-0 w-full"
                  >
                    Request introduction
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Slide-Out Match Insight Drawer (Figma Style) */}
      {activeDrawerMatch && (
        <div className="modal-wrap" role="dialog">
          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setActiveDrawerMatch(null)}
            aria-label="Close insight drawer"
          />
          <aside className="drawer">
            <div className="drawer-head">
              <span className="flex items-center gap-2 text-[#15213b] font-bold">
                <Sparkles className="h-4 w-4 text-[#536df0]" /> Match Explanation Insight
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawerMatch(null)}
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="person large">
              <Avatar
                initials={
                  activeDrawerMatch.full_name
                    ? activeDrawerMatch.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                    : "AL"
                }
                tone="violet"
                size="lg"
              />
              <div>
                <h2 className="font-heading text-xl text-[#15213b]">{activeDrawerMatch.full_name}</h2>
                <p className="text-xs text-[#66758e]">
                  {activeDrawerMatch.job_title} · {activeDrawerMatch.company}
                </p>
                <span className="text-[11px] text-[#8896ab]">
                  Class of {activeDrawerMatch.graduation_year || 2023}
                </span>
              </div>
            </div>

            {/* Score Hero */}
            <div className="score-hero">
              <b className="font-heading">{activeDrawerMatch.total_score}</b>
              <div>
                <h3 className="text-base font-bold text-[#15213b]">
                  {activeDrawerMatch.total_score >= 80 ? "Exceptional alignment" : "Solid relevance fit"}
                </h3>
                <p className="text-xs text-[#66758e]">
                  Calculated deterministically using verified profile fields and availability rules.
                </p>
              </div>
            </div>

            {/* Factor Bars */}
            <div className="factor-list">
              <div>
                <span>
                  <b>Domain alignment (40%)</b>
                  <b>{activeDrawerMatch.d_score}%</b>
                </span>
                <div>
                  <i style={{ width: `${activeDrawerMatch.d_score}%` }} />
                </div>
              </div>

              <div>
                <span>
                  <b>Help-type fit (30%)</b>
                  <b>{activeDrawerMatch.h_score}%</b>
                </span>
                <div>
                  <i style={{ width: `${activeDrawerMatch.h_score}%` }} />
                </div>
              </div>

              <div>
                <span>
                  <b>Available capacity (20%)</b>
                  <b>{activeDrawerMatch.c_score}%</b>
                </span>
                <div>
                  <i style={{ width: `${activeDrawerMatch.c_score}%` }} />
                </div>
              </div>

              <div>
                <span>
                  <b>Recent activity (10%)</b>
                  <b>{activeDrawerMatch.r_score}%</b>
                </span>
                <div>
                  <i style={{ width: `${activeDrawerMatch.r_score}%` }} />
                </div>
              </div>
            </div>

            {/* Grounded AI Brief */}
            {activeDrawerMatch.brief && (
              <div className="why-box">
                <Sparkles className="h-4 w-4 shrink-0 text-[#536df0] mt-0.5" />
                <p>
                  <b>Why this connection</b>
                  <span>{activeDrawerMatch.brief}</span>
                </p>
              </div>
            )}

            <p className="disclaimer">
              <Shield className="h-4 w-4 shrink-0 text-[#8896ab]" />
              This score ranks algorithmic relevance based on platform signals. It does not measure mentor character, quality, or guaranteed career success.
            </p>

            <div className="drawer-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveDrawerMatch(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => handleOpenRequestModal(activeDrawerMatch)}
                disabled={activeDrawerMatch.remaining_capacity <= 0}
              >
                Request connection
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Request Connection Dialog (Figma Style) */}
      {selectedMatch && (
        <div className="modal-wrap" role="dialog">
          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setSelectedMatch(null)}
            aria-label="Cancel request modal"
          />
          <div className="dialog">
            <button
              type="button"
              className="x"
              onClick={() => setSelectedMatch(null)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="dialog-icon">
              <Users className="h-6 w-6 text-[#536df0]" />
            </div>

            <h2 className="font-heading text-xl text-[#15213b]">
              Request a connection with {selectedMatch.full_name}?
            </h2>
            <p className="text-xs text-[#66758e]">
              Sending a request shares your goal and personal note. Each request debits 1 monthly token.
            </p>

            {requestError && (
              <div className="my-3">
                <Alert variant="error" title="Outreach Error">
                  {requestError}
                </Alert>
              </div>
            )}

            {requestSuccess && (
              <div className="my-3">
                <Alert variant="success" title="Success">
                  {requestSuccess}
                </Alert>
              </div>
            )}

            {/* Token Cost Card */}
            <div className="cost">
              <Zap className="h-5 w-5 text-[#536df0] shrink-0" />
              <div>
                <b className="text-sm text-[#15213b]">1 monthly token required</b>
                <small>You will have {(tokens?.tokens_remaining ?? 4) - 1} of {tokens?.tokens_granted ?? 5} remaining</small>
              </div>
            </div>

            {/* Repeat Contact Warning */}
            {selectedMatch.is_repeat_contact && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2 mb-3">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Repeat Contact Safeguard</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  You previously requested an introduction with {selectedMatch.full_name} earlier this month. Please provide a clear follow-up rationale to proceed.
                </p>
                <div className="field">
                  <label htmlFor="repeatReason">Reason for repeat request</label>
                  <textarea
                    id="repeatReason"
                    rows={2}
                    placeholder="e.g. Following up with updated case study notes based on prior recommendations..."
                    value={repeatReason}
                    onChange={(e) => setRepeatReason(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Personalized Ask Field */}
            <div className="field">
              <label htmlFor="ask">Your specific ask (min 15 characters)</label>
              <textarea
                id="ask"
                rows={3}
                placeholder="What specific outcome or question would you like guidance on?"
                value={studentMessage}
                onChange={(e) => setStudentMessage(e.target.value)}
              />
            </div>

            <div className="dialog-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelectedMatch(null)}
                disabled={requestLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSendRequest}
                isLoading={requestLoading}
                disabled={
                  studentMessage.trim().length < 15 ||
                  (selectedMatch.is_repeat_contact && repeatReason.trim().length < 5)
                }
              >
                <span>Send request</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchesPage() {
  return (
    <PortalShell>
      <Suspense fallback={<div className="p-12 text-center text-sm text-[#66758e]">Loading matches...</div>}>
        <MatchesContent />
      </Suspense>
    </PortalShell>
  );
}
