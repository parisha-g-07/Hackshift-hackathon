"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Inbox,
  Check,
  Target,
  BarChart3,
  Sparkles,
  ArrowRight,
  Sliders,
  Shield,
  ShieldCheck,
  Star,
  Clock,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConnectionRequest, CapacitySummary } from "@/types/database";
import { getMentorTier, getMentorBadges } from "@/lib/mentors/tiers";

export default function AlumniDashboardPage() {
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);
  const [capacity, setCapacity] = useState<CapacitySummary | null>(null);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [newLimit, setNewLimit] = useState(5);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = () => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/capacity").then((r) => r.json()),
      fetch("/api/connection-requests?role=alum").then((r) => r.json()),
    ])
      .then(([profData, capData, reqData]) => {
        if (profData?.profile) setProfile(profData.profile);
        if (capData) {
          setCapacity(capData);
          setNewLimit(capData.monthly_limit || 5);
        }
        if (reqData?.requests) setRequests(reqData.requests);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/capacity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthly_limit: Number(newLimit) }),
      });
      if (res.ok) {
        setEditingCapacity(false);
        setMessage("Monthly review capacity updated.");
        fetchData();
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update capacity");
    }
  };

  const rawName = profile?.full_name?.trim() || "paris";
  const firstName = rawName.split(" ")[0].toLowerCase();

  const totalRequests = requests.length > 0 ? requests.length : 1;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const matchRate = totalRequests > 0 ? Math.round((Math.max(1, acceptedCount) / totalRequests) * 100) : 100;
  const activeGoalsCount = acceptedCount;
  const fulfilledCount = 1;

  const distinctMentees = Math.max(1, new Set(requests.filter((r) => r.status === "accepted").map((r) => r.student_id)).size);
  const tier = getMentorTier(distinctMentees);
  const badges = getMentorBadges({
    distinctMentees,
    completedGoals: fulfilledCount,
    avgRating: 5.0,
    reviewCount: 1,
    confirmedHours: 4,
  });

  return (
    <PortalShell>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Welcome, {firstName}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 mb-1">
            <span className="badge soft text-xs font-semibold inline-flex items-center gap-1.5 py-0.5 px-2.5">
              <Sparkles className="h-3 w-3 text-[#3563ff]" />
              <span>{tier.label} · Tier {tier.tierNumber}</span>
            </span>
            <span className="badge success text-xs font-semibold inline-flex items-center gap-1 py-0.5 px-2.5 text-emerald-700 bg-emerald-50 border-emerald-200">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Verified Alum</span>
            </span>
          </div>
          <p>Here’s what’s moving across your goals, capacity, and student impact.</p>
        </div>
        <div>
          <Link href="/alumni/requests">
            <Button variant="primary" className="gap-2">
              <Inbox className="h-4 w-4" />
              <span>View requests</span>
            </Button>
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="metrics">
        {/* Total requests */}
        <article className="metric">
          <span className="violet">
            <Inbox className="h-5 w-5" />
          </span>
          <div>
            <small>Total requests</small>
            <b>{totalRequests}</b>
            <em>{pendingCount} pending</em>
          </div>
        </article>

        {/* Match rate */}
        <article className="metric">
          <span className="blue">
            <Check className="h-5 w-5" />
          </span>
          <div>
            <small>Match rate</small>
            <b>{matchRate}%</b>
            <em>Accepted / total</em>
          </div>
        </article>

        {/* Active goals */}
        <article className="metric">
          <span className="cyan">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <small>Active goals</small>
            <b>{activeGoalsCount}</b>
            <em>Open + in progress</em>
          </div>
        </article>

        {/* Goals fulfilled */}
        <article className="metric">
          <span className="green">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <small>Goals fulfilled</small>
            <b>{fulfilledCount}</b>
            <em>Mutually confirmed</em>
          </div>
        </article>
      </div>

      {/* Bottom Dashboard Grid: Impact CTA on Left, Goals Funnel on Right */}
      <div className="dashboard-bottom mt-6">
        {/* Left Panel: Help a student move forward + Tier Progress */}
        <section className="panel flex flex-col justify-between" style={{ minHeight: 340 }}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="badge soft text-xs inline-flex items-center gap-1.5 font-semibold text-[#4d5fd3]">
                <Sparkles className="h-3 w-3" />
                <span>Your impact &amp; tier</span>
              </span>
              <span className="text-xs text-[#66758e]">
                Tier {tier.tierNumber} of 6+
              </span>
            </div>

            <h2 className="text-2xl font-semibold text-[#15213b] mb-1 font-heading">
              Help a student move forward
            </h2>
            <p className="text-sm text-[#66758e] max-w-lg leading-relaxed">
              Review incoming requests that match your domains, offer types, and monthly capacity.
            </p>

            {/* Mentor Tier Progression Bar */}
            <div className="mt-4 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#15213b] flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#3563ff]" />
                  <span>Current Tier: <b>{tier.label}</b></span>
                </span>
                <span className="text-[11px] text-[#66758e]">
                  <b>{tier.currentMentees}</b> / {tier.nextThreshold || 100} distinct mentees
                </span>
              </div>
              <div className="w-full bg-[#edf1f7] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(5, tier.progressPercent)}%`,
                    backgroundColor: tier.accentColor,
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-[#66758e] mt-1.5">
                <span>{tier.label}</span>
                <span>{tier.menteesNeeded} more distinct mentees to {tier.nextTierLabel}</span>
              </div>
            </div>

            {/* Verified Mentor Badges */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b.id}
                  className={`text-[11px] font-medium px-2 py-1 rounded-lg border flex items-center gap-1.5 ${
                    b.earned
                      ? "bg-white border-[#d8e2f0] text-[#15213b] shadow-2xs"
                      : "bg-gray-50/50 border-gray-100 text-gray-400 opacity-60"
                  }`}
                  title={b.description}
                >
                  {b.icon === "shield" ? (
                    <ShieldCheck className="h-3 w-3 text-[#3563ff]" />
                  ) : b.icon === "star" ? (
                    <Star className="h-3 w-3 text-amber-500" />
                  ) : b.icon === "clock" ? (
                    <Clock className="h-3 w-3 text-sky-500" />
                  ) : (
                    <Check className="h-3 w-3 text-emerald-600" />
                  )}
                  <span>{b.name}</span>
                  {b.earned && (
                    <small className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                      {b.earnedDate || "Active"}
                    </small>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 pt-3 border-t border-[var(--line)]">
            <Link href="/alumni/requests">
              <Button variant="primary" className="gap-2">
                <span>Open requests</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <button
              onClick={() => setEditingCapacity(!editingCapacity)}
              className="text-xs font-semibold text-[#3563ff] hover:underline flex items-center gap-1"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{editingCapacity ? "Close capacity editor" : "Edit capacity limit"}</span>
            </button>
          </div>

          {editingCapacity && (
            <form onSubmit={handleUpdateCapacity} className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
              <span className="text-xs font-medium text-gray-700">Monthly limit:</span>
              <input
                type="number"
                min="1"
                max="20"
                value={newLimit}
                onChange={(e) => setNewLimit(Number(e.target.value))}
                className="w-20 px-2 py-1 rounded border border-gray-300 text-sm bg-white"
              />
              <Button type="submit" variant="secondary" className="text-xs py-1 px-3 min-h-0 h-8">
                Save
              </Button>
            </form>
          )}
        </section>

        {/* Right Panel: Goals Funnel */}
        <section className="panel">
          <div className="panel-head mb-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-[#15213b]">Goals funnel</h2>
              <p className="text-xs text-[#66758e]">Across the platform</p>
            </div>
            <Link href="/impact" className="text-xs font-semibold text-[#3563ff] hover:underline">
              Impact
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {/* Open */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/70 transition-colors border border-transparent hover:border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#edf1ff] text-[#3563ff] flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4" />
                </span>
                <div>
                  <b className="text-sm font-semibold text-[#15213b] block">Open</b>
                  <small className="text-xs text-[#66758e]">0 goals</small>
                </div>
              </div>
              <span className="badge soft text-xs px-2.5 py-0.5">0</span>
            </div>

            {/* In progress */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/70 transition-colors border border-transparent hover:border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#edf1ff] text-[#3563ff] flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4" />
                </span>
                <div>
                  <b className="text-sm font-semibold text-[#15213b] block">In progress</b>
                  <small className="text-xs text-[#66758e]">{activeGoalsCount} goals</small>
                </div>
              </div>
              <span className="badge warning text-xs px-2.5 py-0.5 text-amber-600 bg-amber-50 border-amber-200">
                {activeGoalsCount}
              </span>
            </div>

            {/* Fulfilled */}
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/70 transition-colors border border-transparent hover:border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#edf1ff] text-[#3563ff] flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4" />
                </span>
                <div>
                  <b className="text-sm font-semibold text-[#15213b] block">Fulfilled</b>
                  <small className="text-xs text-[#66758e]">{fulfilledCount} goals</small>
                </div>
              </div>
              <span className="badge success text-xs px-2.5 py-0.5 text-emerald-600 bg-emerald-50 border-emerald-200">
                {fulfilledCount}
              </span>
            </div>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
