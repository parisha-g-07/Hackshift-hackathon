"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, CheckCircle, AlertTriangle, Users, MessageSquare, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { PortalShell } from "@/components/layout/portal-shell";
import { ConnectionRequest } from "@/types/database";

export default function AlumniRequestsPage() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRequests = () => {
    fetch("/api/connection-requests?role=alum")
      .then((r) => r.json())
      .then((d) => {
        if (d?.requests) setRequests(d.requests);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (
    requestId: string,
    action: "accept" | "decline" | "defer" | "ignore"
  ) => {
    setActionLoading(requestId);
    setMessage(null);

    try {
      const res = await fetch(`/api/connection-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          response_note: responseNotes[requestId] || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }

      setMessage(`Request marked as ${action}ed.`);
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PortalShell>
      <div>
        <Link
          href="/alumni/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66758e] hover:text-[#15213b] mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Hub</span>
        </Link>
        <div className="page-head">
          <div>
            <h1 className="font-heading">Incoming Connection Requests</h1>
            <p>
              Review student asks within your monthly capacity. Accepted requests transition to active collaborative goals.
            </p>
          </div>
        </div>
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {loading ? (
        <div className="p-12 text-center text-sm text-[#66758e]">Loading incoming requests...</div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No incoming requests"
          description="Your review queue is currently clear. When students find your offers via SQL matching, requests appear here."
          actionLabel="View Dashboard"
          actionHref="/alumni/dashboard"
        />
      ) : (
        <div className="space-y-4 max-w-4xl">
          {requests.map((req, idx) => {
            const initials = req.student?.full_name
              ? req.student.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
              : "ST";
            const tones = ["cyan", "violet", "coral", "blue"] as const;
            const tone = tones[idx % tones.length];

            return (
              <article key={req.id} className="request-card">
                <div className="person">
                  <Avatar initials={initials} tone={tone} size="md" />
                  <div>
                    <h3 className="font-bold text-[#15213b] text-base">
                      {req.student?.full_name || "Student Requester"}
                    </h3>
                    <p className="text-xs text-[#66758e]">
                      Year {req.student?.study_year || 4} Undergraduate · Computer Science
                    </p>
                  </div>
                  <RequestStatusBadge status={req.status} />
                </div>

                <div className="request-goal">
                  <small className="text-xs font-semibold text-[#8896ab] uppercase tracking-wider">
                    Target Goal
                  </small>
                  <b className="text-sm text-[#15213b] font-bold">
                    {req.intent?.title || "Career Advice"}
                  </b>
                  <p className="text-xs text-[#66758e] italic leading-relaxed mt-1">
                    &quot;{req.student_message}&quot;
                  </p>
                </div>

                <div className="rationale">
                  <Sparkles className="h-3.5 w-3.5 text-[#536df0] shrink-0" />
                  <span>High domain overlap &amp; verified help-type compatibility · Est. 20 min review</span>
                </div>

                {req.repeat_contact_in_month && req.repeat_reason && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 mt-2">
                    <strong>Repeat outreach justification:</strong> &quot;{req.repeat_reason}&quot;
                  </div>
                )}

                {/* If pending, response note & action buttons */}
                {req.status === "pending" && (
                  <div className="pt-3 border-t border-[#edf0f5] mt-3 space-y-3">
                    <div className="field">
                      <label htmlFor={`note-${req.id}`} className="text-xs font-semibold text-[#66758e]">
                        Optional response note to student
                      </label>
                      <input
                        id={`note-${req.id}`}
                        placeholder="e.g. Happy to help! Let's schedule 30 mins next week..."
                        value={responseNotes[req.id] || ""}
                        onChange={(e) =>
                          setResponseNotes({ ...responseNotes, [req.id]: e.target.value })
                        }
                      />
                    </div>

                    <div className="card-actions">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAction(req.id, "decline")}
                        isLoading={actionLoading === req.id}
                        className="text-xs text-rose-600 hover:text-rose-700"
                      >
                        Decline
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAction(req.id, "defer")}
                        isLoading={actionLoading === req.id}
                        className="text-xs"
                      >
                        Defer (Next Week)
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction(req.id, "accept")}
                        isLoading={actionLoading === req.id}
                        className="text-xs"
                      >
                        Accept &amp; Open Workspace
                      </Button>
                    </div>
                  </div>
                )}

                {req.status === "accepted" && (
                  <div className="pt-3 border-t border-[#edf0f5] mt-3 flex items-center justify-between">
                    <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Accepted · Active collaborative goal established
                    </span>
                    <Link href="/goals/77777777-7777-7777-7777-777777777701">
                      <Button size="sm" variant="secondary" className="text-xs">
                        Open Goal Workspace
                      </Button>
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
