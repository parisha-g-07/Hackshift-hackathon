"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Save,
  Sparkles,
  Building,
  GraduationCap,
  Briefcase,
  CheckCircle,
  Edit3,
  Star,
  Clock,
} from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import { getMentorTier, getMentorBadges } from "@/lib/mentors/tiers";
import {
  getGraduationYearOptions,
  GRADUATION_MONTHS,
  calculateStudyYear,
  getStudyYearLabel,
} from "@/lib/students/study-year";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tokens, setTokens] = useState<{
    tokens_remaining: number;
    tokens_granted: number;
  } | null>(null);
  const [capacity, setCapacity] = useState<{
    monthly_limit: number;
    current_month_requests: number;
  } | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [bio, setBio] = useState("");
  const [gradMonth, setGradMonth] = useState<number>(5);
  const [gradYear, setGradYear] = useState<number>(2028);
  const [alumGradYear, setAlumGradYear] = useState<number>(2024);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((profData) => {
        if (profData?.profile) {
          const p = profData.profile;
          setProfile(p);
          setFullName(p.full_name || "");
          setInstitution(p.institution || "Tech University");
          setBio(p.bio || "");
          if (p.expected_graduation_year) setGradYear(p.expected_graduation_year);
          if (p.expected_graduation_month) setGradMonth(p.expected_graduation_month);
          if (p.graduation_year) setAlumGradYear(p.graduation_year);

          if (p.role === "alum") {
            fetch("/api/capacity")
              .then((r) => r.json())
              .then((cap) => setCapacity(cap))
              .catch(() => {});
            fetch("/api/connection-requests?role=alum")
              .then((r) => r.json())
              .then((res) => {
                if (res?.requests) setRequests(res.requests);
              })
              .catch(() => {});
          } else {
            fetch("/api/tokens/balance")
              .then((r) => r.json())
              .then((tok) => setTokens(tok))
              .catch(() => {});
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/sign-in";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          institution,
          bio,
          ...(isStudent
            ? {
                expected_graduation_year: Number(gradYear),
                expected_graduation_month: Number(gradMonth),
              }
            : {
                graduation_year: Number(alumGradYear),
              }),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }

      const data = await res.json();
      setProfile(data.profile);
      setMessage("Profile and academic year saved successfully.");
      setEditing(false);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const isAlum = profile?.role === "alum";
  const isStudent = !isAlum;
  const rawName = fullName || profile?.full_name || (isStudent ? "Jordan" : "Paris");
  const cleanName = rawName.replace(/\s*\((student|alum|alumni|mentor|google|linkedin)\)/gi, "").trim();
  const displayName = cleanName || rawName;
  const initial = (displayName[0] || (isStudent ? "J" : "P")).toUpperCase();
  const computedStudyYear = calculateStudyYear(gradMonth, gradYear);

  // Student Token metrics
  const allocation = tokens?.tokens_granted ?? 5;
  const remaining = tokens?.tokens_remaining ?? 2;
  const spent = Math.max(0, allocation - remaining);

  // SVG Ring calculation for tokens
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(100, Math.max(0, (remaining / allocation) * 100));
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // Alumni Mentorship, Capacity & Tier metrics
  const monthlyLimit = capacity?.monthly_limit || 5;
  const usedCapacity = capacity?.current_month_requests || 0;
  const capacityRemaining = Math.max(0, monthlyLimit - usedCapacity);

  const acceptedReqs = requests.filter((r) => r.status === "accepted");
  const activeMentees = Math.max(1, acceptedReqs.length);
  const distinctMentees = Math.max(1, new Set(acceptedReqs.map((r) => r.student_id)).size);
  const completedGoals = Math.max(1, acceptedReqs.length);

  const tier = getMentorTier(distinctMentees);
  const badges = getMentorBadges({
    distinctMentees,
    completedGoals,
    avgRating: 5.0,
    reviewCount: 1,
    confirmedHours: 4,
  });

  const tierStrokeDashoffset =
    circumference - (tier.progressPercent / 100) * circumference;

  return (
    <PortalShell>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Your profile</h1>
          <p>Manage the context that powers better matches.</p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* 2-Column Profile Layout */}
      <div className="settings-layout">
        {/* Left Panel: User Profile Header + Ledger + Edit */}
        <section className="panel space-y-6">
          {/* User Card */}
          <div className="flex items-center justify-between pb-6 border-b border-[var(--line)]">
            <div className="flex items-center gap-4">
              <span
                className="avatar"
                style={{
                  width: 64,
                  height: 64,
                  fontSize: 22,
                  borderRadius: 20,
                  boxShadow: "0 8px 20px rgba(53,99,255,0.22)",
                }}
              >
                {initial}
              </span>
              <div>
                <h2 className="text-2xl font-bold text-[#15213b] capitalize font-heading">
                  {displayName}
                </h2>
                {isAlum ? (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-sm text-[#66758e]">Alumni mentor</p>
                    <span className="badge soft text-xs font-semibold flex items-center gap-1.5 py-0.5 px-2">
                      <Sparkles className="h-3 w-3 text-[#3563ff]" />
                      <span>{tier.label}</span>
                    </span>
                    <span className="badge success text-xs font-semibold flex items-center gap-1 py-0.5 px-2 text-emerald-700 bg-emerald-50 border-emerald-200">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span>Verified Alum</span>
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-[#66758e]">
                    {profile?.study_year ? `${getStudyYearLabel(profile.study_year)} Student` : "Student"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="btn secondary text-xs h-9 px-3"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{editing ? "Cancel" : "Edit details"}</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="btn secondary text-xs h-9 px-3"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Role-Specific Ledger */}
          {isAlum ? (
            <div className="ledger mb-0">
              <span>
                Monthly review limit <b>{monthlyLimit}</b>
              </span>
              <span>
                Active mentees <b>{activeMentees}</b>
              </span>
              <span>
                Goals fulfilled <b>{completedGoals}</b>
              </span>
              <span>
                Remaining capacity <b>{capacityRemaining}</b>
              </span>
            </div>
          ) : (
            <div className="ledger mb-0">
              <span>
                Monthly token allocation <b>{allocation}</b>
              </span>
              <span>
                Tokens remaining <b>{remaining}</b>
              </span>
              <span>
                Tokens spent <b>{spent}</b>
              </span>
            </div>
          )}

          {/* Read-Only Details when not editing */}
          {!editing && (
            <div className="pt-4 border-t border-[var(--line)] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-[#66758e] block font-medium">Institution</span>
                  <span className="font-semibold text-[#15213b]">{institution || "Tech University"}</span>
                </div>
                {isStudent ? (
                  <div>
                    <span className="text-xs text-[#66758e] block font-medium">Academic Standing</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#2b44b8]">
                      <Sparkles className="h-3.5 w-3.5 text-[#3563ff]" />
                      {profile?.study_year ? getStudyYearLabel(profile.study_year) : computedStudyYear.label}
                      <span className="text-xs text-[#66758e] font-normal">
                        ({profile?.expected_graduation_month ? GRADUATION_MONTHS.find(m => m.value === profile.expected_graduation_month)?.label : GRADUATION_MONTHS.find(m => m.value === gradMonth)?.label} {profile?.expected_graduation_year || gradYear})
                      </span>
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs text-[#66758e] block font-medium">Graduation Year</span>
                    <span className="font-semibold text-[#15213b]">{profile?.graduation_year || alumGradYear}</span>
                  </div>
                )}
              </div>
              {bio && (
                <div className="pt-1">
                  <span className="text-xs text-[#66758e] block font-medium mb-1.5">Bio &amp; Goals</span>
                  <p className="text-sm text-[#15213b] whitespace-pre-line bg-[#f8fafc] p-3.5 rounded-xl border border-[#e5eaf2] leading-relaxed">
                    {bio}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Inline Edit Form */}
          {editing && (
            <form onSubmit={handleSaveProfile} className="pt-4 border-t border-[var(--line)] space-y-4">
              <h3 className="font-heading text-base font-semibold text-[#15213b]">
                Edit Profile Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="field">
                  <span>Full name</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                  />
                </label>
                <label className="field">
                  <span>Institution</span>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="University"
                  />
                </label>
              </div>

              {isStudent ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="field">
                      <span>Expected Graduation Month</span>
                      <select
                        value={gradMonth}
                        onChange={(e) => setGradMonth(Number(e.target.value))}
                      >
                        {GRADUATION_MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span>Expected Graduation Year</span>
                      <select
                        value={gradYear}
                        onChange={(e) => setGradYear(Number(e.target.value))}
                      >
                        {getGraduationYearOptions().map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#f0f4ff] border border-[#d6e2ff] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs text-[#2b44b8]">
                      <Sparkles className="h-4 w-4 text-[#3563ff] shrink-0" />
                      <span>
                        Auto-determined Classification: <b>{computedStudyYear.label}</b> ({computedStudyYear.description})
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <label className="field">
                  <span>Graduation Year</span>
                  <select
                    value={alumGradYear}
                    onChange={(e) => setAlumGradYear(Number(e.target.value))}
                  >
                    {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="field">
                <span>Bio &amp; Goals</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={
                    isStudent
                      ? "Tell alumni what career goals you are working toward..."
                      : "Briefly share your industry background and what you can mentor on..."
                  }
                  rows={3}
                />
              </label>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saveLoading}>
                  {saveLoading ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* Right Panel: Role-Specific Card */}
        {isAlum ? (
          <aside className="panel flex flex-col justify-between" style={{ minHeight: 380 }}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-heading text-base font-semibold text-[#15213b]">
                  Mentor Tier &amp; Badges
                </h3>
                <span className="badge soft text-xs font-semibold py-0.5 px-2">
                  {tier.label}
                </span>
              </div>
              <p className="text-xs text-[#66758e] leading-relaxed mb-4">
                Progression is verified automatically through fulfilled student goals.
              </p>

              {/* Circular Ring Gauge for Mentor Tier */}
              <div className="relative w-32 h-32 mx-auto my-3 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#edf1f7"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke={tier.accentColor}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={tierStrokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-2xl font-extrabold text-[#15213b] leading-none">
                    {distinctMentees}
                  </span>
                  <span className="text-[10px] font-semibold text-[#66758e] mt-1">
                    / {tier.nextThreshold || 100} mentees
                  </span>
                </div>
              </div>

              <div className="text-center mb-5">
                <div className="text-xs font-semibold text-[#15213b]">
                  {tier.label} · Tier {tier.tierNumber}
                </div>
                <div className="text-[11px] text-[#66758e] mt-0.5">
                  {tier.menteesNeeded} more distinct mentees to {tier.nextTierLabel}
                </div>
              </div>

              {/* Earned Badges Showcase */}
              <div className="pt-4 border-t border-[var(--line)]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-[#15213b]">
                    Verified Badges
                  </span>
                  <span className="text-[10px] text-[#66758e]">
                    {badges.filter((b) => b.earned).length} of {badges.length} active
                  </span>
                </div>

                <div className="space-y-2">
                  {badges.map((badge) => {
                    const Icon =
                      badge.icon === "shield"
                        ? ShieldCheck
                        : badge.icon === "star"
                        ? Star
                        : badge.icon === "clock"
                        ? Clock
                        : badge.icon === "sparkles"
                        ? Sparkles
                        : CheckCircle;

                    return (
                      <div
                        key={badge.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          badge.earned
                            ? "bg-white border-[#e5eaf2] text-[#15213b]"
                            : "bg-gray-50/50 border-gray-100 text-gray-400 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              badge.earned
                                ? "bg-[#edf1ff] text-[#3563ff]"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="truncate">
                            <div className="font-semibold text-xs truncate">
                              {badge.name}
                            </div>
                            <div className="text-[10px] text-[#66758e] truncate">
                              {badge.description}
                            </div>
                          </div>
                        </div>

                        {badge.earned ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0 ml-1">
                            {badge.earnedDate || "Active"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                            Locked
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        ) : (
          <aside className="panel text-center flex flex-col items-center justify-between" style={{ minHeight: 300 }}>
            <div className="w-full">
              <h3 className="font-heading text-lg font-semibold text-[#15213b] mb-4">Tokens left</h3>

              {/* Circular Ring Gauge */}
              <div className="relative w-32 h-32 mx-auto my-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#edf1f7"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Active Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#3563ff"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-3xl font-extrabold text-[#15213b] leading-none">
                    {remaining}
                  </span>
                  <span className="text-xs font-semibold text-[#3563ff] mt-0.5">tok</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#66758e] leading-relaxed max-w-xs mx-auto">
              Spend tokens on your best-matched alumni. Each request costs one token.
            </p>
          </aside>
        )}
      </div>
    </PortalShell>
  );
}
