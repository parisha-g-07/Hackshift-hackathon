"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Target, Plus, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PortalShell } from "@/components/layout/portal-shell";
import { Intent } from "@/types/database";

export default function StudentIntentsPage() {
  const [intents, setIntents] = useState<Intent[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/intents")
      .then((r) => r.json())
      .then((d) => {
        if (d?.intents) setIntents(d.intents);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? intents : intents.filter((i) => i.status === filter);

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
            <h1 className="font-heading">Goals &amp; Intents</h1>
            <p>Turn career intent into clear, trackable progress with transparent alumni matching.</p>
          </div>
          <div>
            <Link href="/student/intents/new">
              <Button variant="primary" className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>Create New Intent</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Figma Tabs */}
      <div className="tabs">
        {[
          { key: "all", label: "All Intents" },
          { key: "open", label: "Open & Matching" },
          { key: "in_progress", label: "In Progress" },
          { key: "fulfilled", label: "Fulfilled" },
          { key: "closed", label: "Closed" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={filter === t.key ? "active" : ""}
          >
            {t.label}{" "}
            <span>
              {t.key === "all"
                ? intents.length
                : intents.filter((i) => i.status === t.key).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-[#66758e]">Loading your intents...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No intents found"
          description="Create a structured intent with your target role and domains to start matching with alumni."
          actionLabel="Create New Intent"
          actionHref="/student/intents/new"
        />
      ) : (
        <div className="goal-cards">
          {filtered.map((intent) => (
            <article key={intent.id} className="flex flex-col justify-between">
              <div>
                <div className="goal-card-top">
                  <span className="goal-icon">
                    <Target className="h-4 w-4" />
                  </span>
                  <Badge variant={intent.status === "open" ? "default" : "secondary"}>
                    {intent.status}
                  </Badge>
                </div>
                <h2 className="font-heading text-lg font-bold text-[#15213b] mt-3 mb-1">
                  {intent.title}
                </h2>
                <p className="text-xs text-[#536df0] font-semibold mb-2">
                  Format: {intent.help_type?.name || "Career Guidance"}
                </p>
                <p className="text-xs text-[#66758e] line-clamp-3 leading-relaxed mb-4">
                  {intent.description}
                </p>

                {/* Domain Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {intent.domains?.map((d) => (
                    <span
                      key={d.id}
                      className="text-[11px] bg-[#f0f3ff] text-[#4056c6] px-2 py-0.5 rounded-md font-medium"
                    >
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#edf0f5]">
                <Link href={`/student/matches?intentId=${intent.id}`} className="w-full block">
                  <Button variant="primary" size="sm" className="w-full gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Find Ranked Matches</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
