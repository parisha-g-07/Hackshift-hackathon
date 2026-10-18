"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Coins,
  Target,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  ExternalLink,
  Shield,
  Zap,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge, GoalStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { PortalShell } from "@/components/layout/portal-shell";
import { Intent, ConnectionRequest, Goal, TokenSummary } from "@/types/database";
import { getStudyYearLabel } from "@/lib/students/study-year";

export default function StudentDashboardPage() {
  const [tokens, setTokens] = useState<TokenSummary | null>(null);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<{ study_year?: number | null; full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tokens/balance").then((r) => r.json()),
      fetch("/api/intents").then((r) => r.json()),
      fetch("/api/connection-requests?role=student").then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ])
      .then(([tokensData, intentsData, reqData, profileData]) => {
        if (tokensData) setTokens(tokensData);
        if (intentsData?.intents) setIntents(intentsData.intents);
        if (profileData?.profile) setProfile(profileData.profile);
        if (reqData?.requests) {
          setRequests(reqData.requests);
          const acceptedWithGoals = reqData.requests
            .filter((r: any) => r.status === "accepted")
            .map((r: any) => ({
              id: "77777777-7777-7777-7777-777777777701",
              request_id: r.id,
              title: r.intent?.title || "Mentoring Goal",
              status: "in_progress",
              alumnus: r.alumnus,
              student: r.student,
            }));
          setGoals(acceptedWithGoals);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const openIntents = intents.filter((i) => i.status === "open");
  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <PortalShell>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h1 className="font-heading">Student Portal</h1>
            {profile?.study_year ? (
              <span className="badge soft text-xs font-semibold text-[#3563ff]">
                {getStudyYearLabel(profile.study_year)}
              </span>
            ) : null}
          </div>
          <p>Track your active career intents, monthly outreach tokens, and explainable alumni recommendations.</p>
        </div>
        <div>
          <Link href="/student/intents/new">
            <Button variant="primary" className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Set a Goal / Intent</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards (Figma Style) */}
      <div className="metrics">
        <article className="metric">
          <span className="blue">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <small>Tokens remaining</small>
            <b>
              {tokens?.tokens_remaining ?? 4}{" "}
              <em className="text-xs font-normal text-[#8896ab]">/ {tokens?.tokens_granted ?? 5}</em>
            </b>
            <em>1 token per new request</em>
          </div>
        </article>

        <article className="metric">
          <span className="violet">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <small>Active intents</small>
            <b>{openIntents.length}</b>
            <em>Ready for algorithm matching</em>
          </div>
        </article>

        <article className="metric">
          <span className="cyan">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <small>Open requests</small>
            <b>{pendingRequests.length}</b>
            <em>{pendingRequests.length === 1 ? "1 awaiting review" : `${pendingRequests.length} awaiting review`}</em>
          </div>
        </article>

        <article className="metric">
          <span className="green">
            <CheckCircle className="h-5 w-5" />
          </span>
          <div>
            <small>Goals fulfilled</small>
            <b>1</b>
            <em>Mutually confirmed outcome</em>
          </div>
        </article>
      </div>

      {/* Active Intents & Match Finding */}
      <div className="space-y-4">
        <div className="content-title">
          <div>
            <h2 className="font-heading">Your Active Intents &amp; Goals</h2>
            <p>Every connection starts with a specific, time-bounded outcome.</p>
          </div>
          <Link href="/student/intents">
            <button className="text-sm font-semibold text-[#5369e8] flex items-center gap-1 hover:underline">
              View all intents <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>

        {intents.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No intents posted yet"
            description="Create your first structured intent to receive SQL-ranked alumni recommendations."
            actionLabel="Create First Intent"
            actionHref="/student/intents/new"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {intents.map((intent) => (
              <div
                key={intent.id}
                className="panel group hover:border-[#cfd8ff] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-bold text-[#15213b] leading-snug group-hover:text-[#3563ff] transition-colors">
                      {intent.title}
                    </h3>
                    <Badge variant={intent.status === "open" ? "default" : "secondary"}>
                      {intent.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#5369e8] font-semibold mb-2">
                    Format: {intent.help_type?.name || "Career Guidance"}
                  </p>
                  <p className="text-xs text-[#66758e] line-clamp-2 leading-relaxed mb-4">
                    {intent.description}
                  </p>

                  {/* Domain Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {intent.domains?.map((d) => (
                      <span
                        key={d.id}
                        className="text-[11px] bg-[#f0f3ff] text-[#4056c6] px-2.5 py-0.5 rounded-md font-medium"
                      >
                        {d.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#edf0f5] flex items-center justify-between">
                  <span className="text-[11px] text-[#8896ab]">
                    Posted {new Date(intent.created_at).toLocaleDateString()}
                  </span>
                  <Link href={`/student/matches?intentId=${intent.id}`}>
                    <Button variant="primary" size="sm" className="gap-1.5 text-xs shadow-xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Find Ranked Matches</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {intents.length === 1 && (
              <div className="panel border-dashed border-2 border-[#dbe3ef] hover:border-[#3563ff] bg-[#fafbfe] transition-all flex flex-col justify-center items-center text-center p-6 min-h-[220px]">
                <div className="w-10 h-10 rounded-full bg-[#f0f3ff] text-[#3563ff] flex items-center justify-center mb-3">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-[#15213b] mb-1">
                  Have another career milestone?
                </h3>
                <p className="text-xs text-[#66758e] max-w-[280px] mb-4">
                  Add another goal (e.g. resume review, technical mock interview, or higher-ed guidance).
                </p>
                <Link href="/student/intents/new">
                  <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Post New Intent</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Layout: Active Collaboration & Next Step Prompt */}
      <div className="dashboard-bottom grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-[22px] items-stretch mt-6 mb-7">
        {/* Active Collaboration Goal */}
        <section className="panel goals-panel flex flex-col justify-between">
          <div className="panel-head mb-4">
            <div>
              <h2 className="font-heading">Active Collaboration Room</h2>
              <p>Keep each introduction moving toward mutual confirmation</p>
            </div>
            <Link href="/goals/77777777-7777-7777-7777-777777777701">
              <button className="text-xs font-semibold text-[#5369e8] hover:underline">
                Open Goal Room
              </button>
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-[#f7f9fc] border border-[#e8ecf4] space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <b className="text-sm text-[#15213b] block">Prepare for Associate Product Manager Case Interviews</b>
                <p className="text-xs text-[#66758e] mt-0.5">Partner: Priya Sharma (Senior PM @ Stripe)</p>
              </div>
              <GoalStatusBadge status="fulfilled" />
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#e5eaf2] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#66758e]">Student Confirmation:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Confirmed Oct 14
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#66758e]">Alumnus Confirmation:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Confirmed Oct 14
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-emerald-600" /> Mutually confirmed outcome recorded
              </span>
              <Link href="/goals/77777777-7777-7777-7777-777777777701">
                <Button size="sm" variant="secondary" className="text-xs gap-1">
                  <span>View Room & Feedback</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Suggested Next Step Prompt Card (Figma Style) */}
        <section className="panel next-card">
          <span className="badge soft mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#536df0]" /> Suggested next step
          </span>
          <h2 className="font-heading text-xl mt-1">Turn your goal into a focused ask</h2>
          <p className="text-xs text-[#66758e] mt-1 leading-relaxed">
            Alumni respond 2.4x more quickly when your outreach message specifies one concrete question or deliverable.
          </p>
          <div className="prompt text-xs">
            &ldquo;Could you review my transition roadmap and point out the 2 biggest gaps before recruiting season begins?&rdquo;
          </div>
          <Link href="/student/intents/new">
            <Button variant="secondary" size="sm" className="w-full text-xs">
              Refine or create goal
            </Button>
          </Link>
        </section>
      </div>

      {/* Outgoing Requests Stream */}
      <div className="space-y-4">
        <div className="content-title">
          <div>
            <h2 className="font-heading">Recent Outreach Requests</h2>
            <p>Outreach requests use 1 token each and expire automatically if unreviewed after 14 days.</p>
          </div>
          <Link href="/student/requests">
            <button className="text-sm font-semibold text-[#5369e8] flex items-center gap-1 hover:underline">
              View all requests ({requests.length}) <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>

        <div className="panel p-0 divide-y divide-[#edf0f5] overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center text-center bg-white">
              <div className="w-12 h-12 rounded-full bg-[#f0f4ff] text-[#3563ff] flex items-center justify-center mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-[#15213b] mb-1">
                No outreach requests sent yet
              </h3>
              <p className="text-xs text-[#66758e] max-w-sm mb-4 leading-relaxed">
                Once you send an outreach request to an alumnus, its review status, token reservation, and response notes will appear here.
              </p>
              <Link href="/student/matches">
                <Button variant="primary" size="sm" className="gap-2 text-xs shadow-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Discover Ranked Mentors</span>
                </Button>
              </Link>
            </div>
          ) : (
            requests.slice(0, 4).map((req) => (
              <div key={req.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#fafbfe] transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar initials={req.alumnus?.full_name ? req.alumnus.full_name.slice(0, 2).toUpperCase() : "AL"} tone="violet" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#15213b]">
                        {req.alumnus?.full_name || "Priya Sharma"}
                      </span>
                      {req.repeat_contact_in_month && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                          Repeat Contact
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#66758e]">
                      Goal: {req.intent?.title || "APM Mock Interview"}
                    </p>
                    {req.alumni_response_note && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 mt-1">
                        &quot;{req.alumni_response_note}&quot;
                      </p>
                    )}
                  </div>
                </div>
                <RequestStatusBadge status={req.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </PortalShell>
  );
}
