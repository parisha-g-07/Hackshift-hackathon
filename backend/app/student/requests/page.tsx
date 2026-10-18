"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, CheckCircle, AlertTriangle, ArrowLeft, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { PortalShell } from "@/components/layout/portal-shell";
import { ConnectionRequest } from "@/types/database";

export default function StudentRequestsPage() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRequests = () => {
    fetch("/api/connection-requests?role=student")
      .then((r) => r.json())
      .then((d) => {
        if (d?.requests) setRequests(d.requests);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleWithdraw = async (requestId: string) => {
    setActionLoading(requestId);
    setMessage(null);

    try {
      const res = await fetch(`/api/connection-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to withdraw request");
      }

      setMessage("Request successfully withdrawn.");
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || "Failed to withdraw request");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <PortalShell>
      <div>
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66758e] hover:text-[#15213b] mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="page-head">
          <div>
            <h1 className="font-heading">My Outgoing Requests</h1>
            <p>
              Monitor your active connection requests, alumni responses, and goal room transitions.
            </p>
          </div>
        </div>
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {loading ? (
        <div className="p-12 text-center text-sm text-[#66758e]">Loading requests...</div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No requests sent yet"
          description="Browse ranked alumni matches from your open intents to send your first connection request."
          actionLabel="View Dashboard"
          actionHref="/student/dashboard"
        />
      ) : (
        <div className="space-y-4 max-w-4xl">
          {requests.map((req, idx) => {
            const initials = req.alumnus?.full_name
              ? req.alumnus.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
              : "AL";
            const tones = ["violet", "cyan", "coral", "blue"] as const;
            const tone = tones[idx % tones.length];

            return (
              <article key={req.id} className="request-card">
                <div className="person">
                  <Avatar initials={initials} tone={tone} size="md" />
                  <div>
                    <h3 className="font-bold text-[#15213b] text-base">
                      {req.alumnus?.full_name || "Alumnus Mentor"}
                    </h3>
                    <p className="text-xs text-[#66758e]">
                      {req.alumnus?.job_title} @ {req.alumnus?.company}
                    </p>
                  </div>
                  <RequestStatusBadge status={req.status} />
                  {req.repeat_contact_in_month && (
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Repeat Contact
                    </span>
                  )}
                </div>

                <div className="request-goal">
                  <small className="text-xs font-semibold text-[#8896ab] uppercase tracking-wider">
                    Goal &amp; Intent
                  </small>
                  <b className="text-sm text-[#15213b] font-bold">
                    {req.intent?.title || "Career guidance and mentorship"}
                  </b>
                  <p className="text-xs text-[#66758e] italic leading-relaxed mt-1">
                    &quot;{req.student_message}&quot;
                  </p>
                </div>

                {req.alumni_response_note && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mt-2">
                    <strong>Alumnus Response:</strong> &quot;{req.alumni_response_note}&quot;
                  </div>
                )}

                <div className="pt-3 border-t border-[#edf0f5] mt-3 flex items-center justify-between text-[11px] text-[#8896ab]">
                  <span>
                    Sent on {new Date(req.created_at).toLocaleDateString()} · Auto-expires{" "}
                    {new Date(req.expires_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {req.status === "accepted" && (
                      <Link href={`/goals/77777777-7777-7777-7777-777777777701`}>
                        <Button size="sm" variant="primary" className="text-xs gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Open Goal Workspace</span>
                        </Button>
                      </Link>
                    )}

                    {req.status === "pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-rose-600 hover:text-rose-700"
                        onClick={() => handleWithdraw(req.id)}
                        isLoading={actionLoading === req.id}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        <span>Withdraw Request</span>
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
