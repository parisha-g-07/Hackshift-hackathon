"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Send,
  Star,
  Users,
  ShieldCheck,
  ArrowLeft,
  Award,
  Sparkles,
  Check,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { PortalShell } from "@/components/layout/portal-shell";
import { Goal, Feedback } from "@/types/database";

export default function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: goalId } = use(params);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // New update state
  const [updateText, setUpdateText] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // Confirm loading state
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [referralStatus, setReferralStatus] = useState("none");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchGoalData = () => {
    fetch(`/api/goals/${goalId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.goal) setGoal(d.goal);
        if (d?.updates) setUpdates(d.updates);
        if (d?.feedback) {
          setFeedback(d.feedback);
          if (d.feedback.length > 0) setFeedbackSubmitted(true);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGoalData();
  }, [goalId]);

  const handleConfirmCompletion = async () => {
    setConfirmLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/goals/${goalId}/confirm`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirmation failed");

      if (data.is_fulfilled) {
        setMessage("Both participants confirmed! Goal is now Mutually Fulfilled. 🎉");
      } else {
        setMessage("Your confirmation was recorded. Waiting for your partner's confirmation.");
      }

      fetchGoalData();
    } catch (err: any) {
      alert(err?.message || "Confirmation failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) return;

    setUpdateLoading(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: updateText }),
      });

      if (res.ok) {
        setUpdateText("");
        fetchGoalData();
      }
    } catch (err: any) {
      alert(err?.message || "Failed to post update");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_id: goalId,
          rating: Number(rating),
          comments: feedbackComment,
          referral_status: referralStatus,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit feedback");
      }

      setFeedbackSubmitted(true);
      setMessage("Thank you! Your feedback and outcome have been recorded.");
      fetchGoalData();
    } catch (err: any) {
      alert(err?.message || "Failed to submit feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-sm text-[#66758e]">Loading goal workspace...</div>;
  }

  if (!goal) {
    return <div className="p-16 text-center text-sm text-[#66758e]">Goal not found.</div>;
  }

  const isStudentConfirmed = Boolean(goal.student_confirmed_at);
  const isAlumConfirmed = Boolean(goal.alum_confirmed_at);
  const isFulfilled = goal.status === "fulfilled" || (isStudentConfirmed && isAlumConfirmed);

  const studentInitials = goal.student?.full_name
    ? goal.student.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "ST";
  const alumInitials = goal.alumnus?.full_name
    ? goal.alumnus.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "AL";

  return (
    <PortalShell>
      <div>
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66758e] hover:text-[#15213b]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {/* Figma Workspace Head */}
      <div className="workspace-head shadow-sm">
        <div className="participants">
          <Avatar initials={studentInitials} tone="cyan" size="md" />
          <Avatar initials={alumInitials} tone="violet" size="md" />
        </div>
        <div>
          <Badge tone={isFulfilled ? "success" : "soft"}>
            {isFulfilled ? "Mutually Fulfilled" : "In Progress"}
          </Badge>
          <h1 className="font-heading text-2xl font-bold text-[#15213b] mt-1 mb-0.5">
            {goal.title}
          </h1>
          <p className="text-xs text-[#66758e]">
            {goal.student?.full_name || "Student"} &amp; {goal.alumnus?.full_name || "Alumnus"} · Started{" "}
            {new Date(goal.created_at).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="badge demo text-xs">Mutual Fulfillment Mode</span>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="workspace-grid">
        {/* Left Column: Timeline & Progress Notes */}
        <section className="panel timeline space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-[#edf0f5]">
            <h2 className="font-heading text-xl text-[#15213b]">Activity &amp; Milestones</h2>
            <span className="text-xs text-[#8896ab]">{updates.length} updates logged</span>
          </div>

          <div className="space-y-1">
            {/* System initial creation event */}
            <div className="timeline-item">
              <span>
                <Check className="h-4 w-4" />
              </span>
              <div>
                <b>Goal workspace established</b>
                <p>Connection request accepted by {goal.alumnus?.full_name || "alumnus"}. Focus roadmap active.</p>
                <small>{new Date(goal.created_at).toLocaleDateString()}</small>
              </div>
            </div>

            {/* User-submitted updates */}
            {updates.map((u) => (
              <div key={u.id} className="timeline-item">
                <span>
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <b>{u.author?.full_name || "Participant update"}</b>
                  <p>{u.content}</p>
                  <small>{new Date(u.created_at).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>

          {/* Add shared update form */}
          <form onSubmit={handleAddUpdate} className="pt-4 border-t border-[#edf0f5] space-y-3">
            <div className="field">
              <label htmlFor="updateContent">Add a shared milestone note</label>
              <textarea
                id="updateContent"
                placeholder="What changed, mock interview takeaways, or agreed next deliverables?"
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={updateLoading} className="gap-1.5 text-xs">
                <Send className="h-3 w-3" />
                <span>Post note</span>
              </Button>
            </div>
          </form>
        </section>

        {/* Right Column: Agreed Next Steps & Dual Confirmation */}
        <aside className="space-y-5">
          {/* Agreed Next Step Card */}
          <section className="panel next-steps space-y-3">
            <h3 className="font-heading text-base text-[#15213b]">Target Milestone</h3>
            <p className="text-xs text-[#66758e] leading-relaxed">
              Complete mock interview round, review product narrative deck, or formulate next career action items.
            </p>
            <small className="text-xs font-semibold text-[#536df0] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Mutual confirmation required
            </small>
          </section>

          {/* Figma Mutual Completion Panel */}
          <section className="panel completion space-y-3">
            <h3 className="font-heading text-base text-[#15213b]">Mutual Completion</h3>
            <p className="text-xs text-[#66758e] leading-relaxed">
              SyncTies Rule #7: A goal is marked fulfilled only when BOTH participants explicitly confirm. No single-sided fulfillment.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between py-2 border-b border-[#edf0f5]">
                <span className="flex items-center gap-2 text-xs font-bold text-[#15213b]">
                  <Avatar initials={studentInitials} tone="cyan" size="sm" />
                  <span>Student Partner</span>
                </span>
                <Badge tone={isStudentConfirmed ? "success" : "soft"}>
                  {isStudentConfirmed ? "Confirmed" : "Pending"}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#edf0f5]">
                <span className="flex items-center gap-2 text-xs font-bold text-[#15213b]">
                  <Avatar initials={alumInitials} tone="violet" size="sm" />
                  <span>Alumnus Mentor</span>
                </span>
                <Badge tone={isAlumConfirmed ? "success" : "soft"}>
                  {isAlumConfirmed ? "Confirmed" : "Pending"}
                </Badge>
              </div>
            </div>

            {!isFulfilled ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleConfirmCompletion}
                isLoading={confirmLoading}
                className="w-full text-xs mt-3"
              >
                Confirm goal completed
              </Button>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center font-semibold">
                ✓ Goal Mutually Fulfilled
              </div>
            )}
          </section>

          {/* Feedback Card (Enabled only when fulfilled) */}
          {isFulfilled && (
            <section className="panel space-y-3">
              <h3 className="font-heading text-base text-[#15213b] flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Verified Impact Feedback</span>
              </h3>

              {feedbackSubmitted ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <p className="font-semibold">Feedback Recorded</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Your evaluation has been credited to the verified community impact metrics.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-[#15213b] block mb-1">
                      Rating (1 to 5 Stars)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className={`text-lg transition-transform ${
                            rating >= star ? "text-amber-500 scale-110" : "text-slate-300"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="text-xs text-[#8896ab] ml-2">{rating} of 5</span>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="refStatus">Referral Outcome</label>
                    <select
                      id="refStatus"
                      value={referralStatus}
                      onChange={(e) => setReferralStatus(e.target.value)}
                    >
                      <option value="none">General Mentorship Only</option>
                      <option value="offered">Referral Offered</option>
                      <option value="submitted">Formal Referral Submitted</option>
                      <option value="interview">Interview Secured</option>
                      <option value="hired">Hired / Offer Accepted 🎉</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="comments">Review Comments</label>
                    <textarea
                      id="comments"
                      rows={2}
                      placeholder="What was most impactful about this mentorship interaction?"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    isLoading={feedbackLoading}
                  >
                    Submit Verified Feedback
                  </Button>
                </form>
              )}
            </section>
          )}
        </aside>
      </div>
    </PortalShell>
  );
}
