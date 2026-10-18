"use client";

import React, { useState, useEffect } from "react";
import { Shield, User, Bell, Check, AlertTriangle, Sparkles, GraduationCap } from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import {
  getGraduationYearOptions,
  GRADUATION_MONTHS,
  calculateStudyYear,
  getStudyYearLabel,
} from "@/lib/students/study-year";

export default function SettingsPage() {
  const [profile, setProfile] = useState<{
    role?: string;
    full_name?: string;
    email?: string;
    institution?: string;
    study_year?: number | null;
    expected_graduation_year?: number | null;
    expected_graduation_month?: number | null;
    graduation_year?: number | null;
  } | null>(null);
  const [tokens, setTokens] = useState<{
    tokens_remaining: number;
    tokens_granted: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"role" | "notifications" | "account">("role");
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [opportunityUpdates, setOpportunityUpdates] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [gradMonth, setGradMonth] = useState<number>(5);
  const [gradYear, setGradYear] = useState<number>(2028);
  const [alumGradYear, setAlumGradYear] = useState<number>(2024);
  const [savingYear, setSavingYear] = useState(false);
  const [yearMessage, setYearMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.profile) {
          setProfile(d.profile);
          if (d.profile.expected_graduation_year) setGradYear(d.profile.expected_graduation_year);
          if (d.profile.expected_graduation_month) setGradMonth(d.profile.expected_graduation_month);
          if (d.profile.graduation_year) setAlumGradYear(d.profile.graduation_year);
        }
      })
      .catch(() => {});

    fetch("/api/tokens/balance")
      .then((r) => r.json())
      .then((t) => setTokens(t))
      .catch(() => {});
  }, []);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveAcademicYear = async () => {
    setSavingYear(true);
    setYearMessage(null);
    try {
      const payload = isStudent
        ? {
            expected_graduation_year: Number(gradYear),
            expected_graduation_month: Number(gradMonth),
          }
        : {
            graduation_year: Number(alumGradYear),
          };

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update graduation year");
      }

      const data = await res.json();
      if (data?.profile) {
        setProfile(data.profile);
      }
      setYearMessage(
        isStudent
          ? "Academic year and graduation timeline updated successfully."
          : "Graduation year updated successfully."
      );
      setTimeout(() => setYearMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to update graduation year");
    } finally {
      setSavingYear(false);
    }
  };

  const isStudent = profile?.role !== "alum";
  const computedStudyYear = calculateStudyYear(gradMonth, gradYear);
  const allocation = tokens?.tokens_granted ?? 5;
  const currentBalance = tokens?.tokens_remaining ?? 2;
  const spentCount = Math.max(0, allocation - currentBalance);

  return (
    <PortalShell>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Control availability, account preferences, and notifications.</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span>Preferences saved successfully.</span>
        </div>
      )}

      {/* 2-Column Settings Layout */}
      <div className="settings-layout">
        {/* Main Settings Form Card */}
        <section className="panel settings-form">
          {/* Tabs */}
          <div className="tabs">
            <button
              type="button"
              className={activeTab === "role" ? "active" : ""}
              onClick={() => setActiveTab("role")}
            >
              {isStudent ? "Student Profile" : "Alumni Profile"}
            </button>
            <button
              type="button"
              className={activeTab === "notifications" ? "active" : ""}
              onClick={() => setActiveTab("notifications")}
            >
              Notifications
            </button>
            <button
              type="button"
              className={activeTab === "account" ? "active" : ""}
              onClick={() => setActiveTab("account")}
            >
              Account
            </button>
          </div>

          {activeTab === "role" && (
            <>
              {/* Academic Standing & Graduation Year */}
              <h2>{isStudent ? "Academic Standing & Graduation" : "Graduation Year"}</h2>
              <p className="text-xs text-[#66758e] -mt-2 mb-4 leading-relaxed">
                {isStudent
                  ? "Update your expected graduation timeline. Your academic classification (1st, 2nd, 3rd, or 4th Year) is automatically calculated and visible on your profile and match cards."
                  : "Specify your graduation year from your institution."}
              </p>

              {yearMessage && (
                <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <span>{yearMessage}</span>
                </div>
              )}

              {isStudent ? (
                <div className="space-y-4 mb-8 p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
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

                  <div className="p-3.5 rounded-xl bg-[#f0f4ff] border border-[#d6e2ff] flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-xs text-[#2b44b8]">
                      <Sparkles className="h-4 w-4 text-[#3563ff] shrink-0" />
                      <span>
                        Auto-determined Classification: <b>{computedStudyYear.label}</b> ({computedStudyYear.description})
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleSaveAcademicYear}
                      disabled={savingYear}
                    >
                      {savingYear ? "Saving..." : "Save Academic Year"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-8 p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleSaveAcademicYear}
                      disabled={savingYear}
                    >
                      {savingYear ? "Saving..." : "Save Graduation Year"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Ledger based on role */}
              <h2>{isStudent ? "Token ledger" : "Mentorship capacity"}</h2>
              {isStudent ? (
                <div className="ledger">
                  <span>
                    Monthly allocation <b>+{allocation}</b>
                  </span>
                  <span>
                    Outreach requests used <b>−{spentCount}</b>
                  </span>
                  <span>
                    Current balance <b>{currentBalance}</b>
                  </span>
                </div>
              ) : (
                <div className="ledger">
                  <span>
                    Monthly review limit <b>5</b>
                  </span>
                  <span>
                    Active mentee slots <b>3</b>
                  </span>
                  <span>
                    Available reviews <b>2</b>
                  </span>
                </div>
              )}
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <h2>Goal &amp; matching preferences</h2>

              {/* New match recommendations */}
              <div className="setting-row">
                <span>
                  <b>New match recommendations</b>
                  <small>Notify me when relevant alumni become available.</small>
                </span>
                <input
                  type="checkbox"
                  checked={matchNotifications}
                  onChange={(e) => setMatchNotifications(e.target.checked)}
                  aria-label="New match recommendations"
                />
              </div>

              {/* Opportunity updates */}
              <div className="setting-row">
                <span>
                  <b>Opportunity updates</b>
                  <small>Relevant opportunities based on my domains.</small>
                </span>
                <input
                  type="checkbox"
                  checked={opportunityUpdates}
                  onChange={(e) => setOpportunityUpdates(e.target.checked)}
                  aria-label="Opportunity updates"
                />
              </div>

              <Button variant="primary" onClick={handleSave}>
                Save preferences
              </Button>
            </>
          )}

          {activeTab === "account" && (
            <div className="space-y-4">
              <h2>Account information</h2>
              <div className="p-4 rounded-xl border border-[var(--line)] bg-[#f8fafc] space-y-3 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-[#e5eaf2]">
                  <span className="text-[#66758e]">Account Name</span>
                  <span className="font-semibold text-[#15213b]">{profile?.full_name || "SyncTies Member"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#e5eaf2]">
                  <span className="text-[#66758e]">Role</span>
                  <span className="font-semibold capitalize text-[#15213b]">{profile?.role || (isStudent ? "Student" : "Alum")}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#e5eaf2]">
                  <span className="text-[#66758e]">Institution</span>
                  <span className="font-semibold text-[#15213b]">{profile?.institution || "Tech University"}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#66758e]">Authentication</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs border border-emerald-200">
                    Active Session
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Account Side Card */}
        <aside className="panel flex flex-col justify-between" style={{ minHeight: 320 }}>
          <div>
            <h3 className="font-heading text-lg font-semibold text-[#15213b] mb-4">Account</h3>

            <ul className="simple-list space-y-3 text-sm text-[#66758e]">
              <li className="flex items-center gap-2.5 hover:text-[#15213b] cursor-pointer">
                <Shield className="h-4 w-4 text-[#3563ff]" />
                <span>Password &amp; security</span>
              </li>
              <li className="flex items-center gap-2.5 hover:text-[#15213b] cursor-pointer">
                <User className="h-4 w-4 text-[#7c5ce7]" />
                <span>Connected providers</span>
              </li>
              <li className="flex items-center gap-2.5 hover:text-[#15213b] cursor-pointer">
                <Bell className="h-4 w-4 text-[#38b9d8]" />
                <span>Email preferences</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors text-center"
            >
              Request account deletion
            </button>
          </div>
        </aside>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-wrap" role="dialog">
          <button
            className="modal-backdrop"
            onClick={() => setShowDeleteModal(false)}
            aria-label="Close modal"
          />
          <div className="dialog">
            <div className="dialog-icon text-red-600 bg-red-50">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2>Request account deletion?</h2>
            <p>
              Your account, profile information, and connection history will be permanently queued for deletion in accordance with data retention policies.
            </p>
            <div className="dialog-actions mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  alert("Account deletion request submitted.");
                  setShowDeleteModal(false);
                }}
              >
                Confirm Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
