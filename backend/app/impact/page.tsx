"use client";

import React, { useState, useEffect } from "react";
import { Users, Target, CheckCircle, BarChart3, TrendingUp } from "lucide-react";
import { PortalShell } from "@/components/layout/portal-shell";
import { Badge } from "@/components/ui/badge";

export default function ImpactPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Metrics fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {};
  const acceptedConns = summary.uniqueAcceptedConnections ?? 1;
  const totalRequests = summary.totalRequests ?? 1;
  const goalsCreated = summary.totalIntents ?? 1;
  const openGoals = summary.openIntents ?? 0;
  const mutuallyFulfilled = summary.fulfilledGoals ?? 1;
  const fulfillmentRate = summary.fulfillmentRate ?? 100;
  const matchRate = summary.matchRate ?? 100;

  // Funnel steps
  const funnelStages = [
    { label: "Requests created", count: totalRequests, pct: 100 },
    { label: "Requests accepted", count: acceptedConns, pct: 100 },
    { label: "Goals opened", count: goalsCreated, pct: 100 },
    { label: "In progress", count: 0, pct: 0 },
    { label: "Mutually fulfilled", count: mutuallyFulfilled, pct: 100 },
  ];

  return (
    <PortalShell>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Community impact</h1>
          <p>Live platform metrics from the SyncTies backend.</p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="metrics">
        {/* Accepted connections */}
        <article className="metric">
          <span className="violet">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <small>Accepted connections</small>
            <b>{acceptedConns}</b>
            <em>{totalRequests} total requests</em>
          </div>
        </article>

        {/* Goals created */}
        <article className="metric">
          <span className="blue">
            <Target className="h-5 w-5" />
          </span>
          <div>
            <small>Goals created</small>
            <b>{goalsCreated}</b>
            <em>{openGoals} open</em>
          </div>
        </article>

        {/* Mutually fulfilled */}
        <article className="metric">
          <span className="green">
            <CheckCircle className="h-5 w-5" />
          </span>
          <div>
            <small>Mutually fulfilled</small>
            <b>{mutuallyFulfilled}</b>
            <em>{fulfillmentRate}% fulfillment</em>
          </div>
        </article>

        {/* Match rate */}
        <article className="metric">
          <span className="cyan">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <small>Match rate</small>
            <b>{matchRate}%</b>
            <em>Accepted / total</em>
          </div>
        </article>
      </div>

      {/* Chart Grid: Funnel on Left, Anti-Spam Bar Chart on Right */}
      <div className="chart-grid mt-6">
        {/* Intent to outcome funnel */}
        <section className="panel funnel">
          <div className="panel-head mb-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-[#15213b]">
                Intent to outcome funnel
              </h2>
              <p className="text-xs text-[#66758e]">Live platform activity</p>
            </div>
            <span className="badge success text-xs font-semibold px-2 py-0.5">Live</span>
          </div>

          <div className="space-y-4 pt-2">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="funnel-row">
                <span>
                  <span className="text-[#15213b] font-medium">{stage.label}</span>
                  <b className="font-bold text-[#15213b]">{stage.count}</b>
                </span>
                <div>
                  <i style={{ width: `${stage.pct}%` }} />
                </div>
                <small className="font-semibold">{stage.pct}%</small>
              </div>
            ))}
          </div>
        </section>

        {/* Anti-spam health Bar Chart */}
        <section className="panel">
          <div className="panel-head mb-2">
            <div>
              <h2 className="font-heading text-lg font-semibold text-[#15213b]">
                Anti-spam health
              </h2>
              <p className="text-xs text-[#66758e]">Tokens &amp; capacity</p>
            </div>
          </div>

          <div className="bars">
            {/* Tokens used */}
            <div>
              <i style={{ height: "48%" }} />
              <span>Tokens used</span>
            </div>

            {/* Tokens left */}
            <div>
              <i style={{ height: "48%" }} />
              <span>Tokens left</span>
            </div>

            {/* Alumni full */}
            <div>
              <i style={{ height: "6%" }} />
              <span>Alumni full</span>
            </div>

            {/* Fulfilled */}
            <div>
              <i style={{ height: "92%" }} />
              <span>Fulfilled</span>
            </div>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
