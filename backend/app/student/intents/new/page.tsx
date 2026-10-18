"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Target, Check, Sparkles, ArrowRight, ArrowLeft, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { PortalShell } from "@/components/layout/portal-shell";
import { Domain, HelpType } from "@/types/database";

export default function NewIntentPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [helpTypeId, setHelpTypeId] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [helpTypes, setHelpTypes] = useState<HelpType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/domains").then((r) => r.json()),
      fetch("/api/help-types").then((r) => r.json()),
    ]).then(([dData, htData]) => {
      if (dData?.domains) setDomains(dData.domains);
      if (htData?.helpTypes) {
        setHelpTypes(htData.helpTypes);
        if (htData.helpTypes.length > 0) {
          setHelpTypeId(htData.helpTypes[1]?.id || htData.helpTypes[0].id);
        }
      }
    });
  }, []);

  const toggleDomain = (id: string) => {
    if (selectedDomains.includes(id)) {
      setSelectedDomains(selectedDomains.filter((d) => d !== id));
    } else {
      setSelectedDomains([...selectedDomains, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedDomains.length === 0) {
      setError("Please select at least one professional domain.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        help_type_id: helpTypeId,
        target_role: targetRole || undefined,
        target_company: targetCompany || undefined,
        domain_ids: selectedDomains,
      };

      const res = await fetch("/api/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create intent");
      }

      const { intent } = await res.json();
      router.push(`/student/matches?intentId=${intent.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create intent");
      setLoading(false);
    }
  };

  return (
    <PortalShell>
      <div>
        <Link
          href="/student/intents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#66758e] hover:text-[#15213b] mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Intents</span>
        </Link>
        <div className="page-head">
          <div>
            <h1 className="font-heading">Create a Goal or Intent</h1>
            <p>
              A focused intent helps SyncTies compute transparent, explainable recommendations from active alumni offers.
            </p>
          </div>
        </div>
      </div>

      <div className="form-layout">
        {/* Main Goal Form (Left Column) */}
        <section className="panel goal-form">
          <h2 className="font-heading text-2xl text-[#15213b] mb-2">What are you working toward?</h2>
          <p className="text-xs text-[#66758e] mb-6">
            Describe the tangible milestone you are targeting this month.
          </p>

          {error && (
            <div className="mb-5">
              <Alert variant="error" title="Form Error">
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="field">
              <label htmlFor="goalTitle">Goal title</label>
              <input
                id="goalTitle"
                type="text"
                required
                placeholder="e.g. Move into AI product management / Prepare for APM case interviews"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="helpTypeSelect">Format of guidance requested</label>
              <select
                id="helpTypeSelect"
                required
                value={helpTypeId}
                onChange={(e) => setHelpTypeId(e.target.value)}
              >
                {helpTypes.map((ht) => (
                  <option key={ht.id} value={ht.id}>
                    {ht.name} {ht.description ? `— ${ht.description}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="targetRole">Target role (Optional)</label>
                <input
                  id="targetRole"
                  type="text"
                  placeholder="e.g. Associate Product Manager"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="targetCompany">Target company or sector (Optional)</label>
                <input
                  id="targetCompany"
                  type="text"
                  placeholder="e.g. Stripe, Scale AI, Seed Startups"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                />
              </div>
            </div>

            {/* Domain Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#15213b] uppercase tracking-wider">
                Applicable domains (40% of algorithm score)
              </label>
              <p className="text-xs text-[#8896ab]">
                Select 1 to 4 canonical domains. Jaccard similarity is computed over these tags.
              </p>
              <div className="chip-picker pt-1">
                {domains.map((dom) => {
                  const isSelected = selectedDomains.includes(dom.id);
                  return (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => toggleDomain(dom.id)}
                      className={isSelected ? "selected" : ""}
                    >
                      <span>{dom.name}</span>
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label htmlFor="goalContext">Your specific question and context</label>
              <textarea
                id="goalContext"
                required
                rows={4}
                placeholder="Explain where you currently stand, what challenges you are facing, and what specific feedback would help you make progress."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="wizard-actions pt-4 border-t border-[#edf0f5]">
              <Link href="/student/intents">
                <Button type="button" variant="secondary" disabled={loading}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" isLoading={loading} className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Save intent &amp; find matches</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>

        {/* Matching Preview Aside (Right Column) */}
        <aside className="preview-card">
          <span className="badge dark mb-3 inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-cyan-300" /> Matching preview
          </span>
          <h3 className="font-heading text-xl mt-1">A stronger intent creates better matches</h3>
          <p className="text-xs leading-relaxed mt-2 text-[#ccd5f0]">
            SyncTies uses deterministic SQL scoring across verified profile fields to compute transparent recommendations:
          </p>

          <ul className="text-xs space-y-3 my-5 text-[#ccd5f0]">
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                D
              </span>
              <span><b>Domain overlap (40%):</b> Jaccard similarity across selected fields</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                H
              </span>
              <span><b>Help-type fit (30%):</b> Compatibility matrix between ask and active offer</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                C
              </span>
              <span><b>Capacity availability (20%):</b> Open review slots remaining this month</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-5 w-5 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0 text-[10px] font-bold">
                R
              </span>
              <span><b>Activity recency (10%):</b> 14-day exponential half-life curve</span>
            </li>
          </ul>

          <small className="block text-[11px] text-[#919db9] border-t border-white/10 pt-3">
            Scores reflect algorithmic relevance only. They never predict mentor quality or career outcomes.
          </small>
        </aside>
      </div>
    </PortalShell>
  );
}
