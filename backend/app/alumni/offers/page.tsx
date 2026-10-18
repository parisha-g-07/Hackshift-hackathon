"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Plus, Check, Sparkles, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PortalShell } from "@/components/layout/portal-shell";
import { Offer, Domain, HelpType } from "@/types/database";

export default function AlumniOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [helpTypes, setHelpTypes] = useState<HelpType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [helpTypeId, setHelpTypeId] = useState("");
  const [opportunityAvailable, setOpportunityAvailable] = useState(false);
  const [opportunityTitle, setOpportunityTitle] = useState("");
  const [opportunityCompany, setOpportunityCompany] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = () => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((d) => {
        if (d?.offers) setOffers(d.offers);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOffers();
    Promise.all([
      fetch("/api/domains").then((r) => r.json()),
      fetch("/api/help-types").then((r) => r.json()),
    ]).then(([dData, htData]) => {
      if (dData?.domains) setDomains(dData.domains);
      if (htData?.helpTypes) {
        setHelpTypes(htData.helpTypes);
        if (htData.helpTypes.length > 0) {
          setHelpTypeId(htData.helpTypes[0].id);
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

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedDomains.length === 0) {
      setError("Please select at least 1 domain for this offer.");
      return;
    }

    setCreateLoading(true);

    try {
      const payload = {
        title,
        description,
        help_type_id: helpTypeId,
        status: "active",
        opportunity_available: opportunityAvailable,
        opportunity_title: opportunityAvailable ? opportunityTitle : undefined,
        opportunity_company: opportunityAvailable ? opportunityCompany : undefined,
        domain_ids: selectedDomains,
      };

      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create offer");
      }

      setMessage("New mentoring offer published successfully!");
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setSelectedDomains([]);
      fetchOffers();
    } catch (err: any) {
      setError(err?.message || "Failed to create offer");
    } finally {
      setCreateLoading(false);
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
            <h1 className="font-heading">Mentoring &amp; Guidance Offers</h1>
            <p>
              Publish structured offers outlining what support you provide and any active referral opportunities.
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={() => setShowCreateModal(true)} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>Publish New Offer</span>
            </Button>
          </div>
        </div>
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {loading ? (
        <div className="p-12 text-center text-sm text-[#66758e]">Loading offers...</div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No offers published yet"
          description="Create your first mentoring offer so students with matching goals can connect with you."
          actionLabel="Create Offer"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {offers.map((offer) => (
            <div key={offer.id} className="panel flex flex-col justify-between group hover:border-[#cfd8ff] transition-all">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={offer.status === "active" ? "success" : "secondary"}>
                    {offer.status}
                  </Badge>
                  <span className="text-[11px] text-[#8896ab]">
                    Created {new Date(offer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#15213b] mt-1 group-hover:text-[#3563ff] transition-colors">
                  {offer.title}
                </h3>
                <p className="text-xs text-[#536df0] font-semibold mb-2">
                  Format: {offer.help_type?.name || "Career Guidance"}
                </p>
                <p className="text-xs text-[#66758e] leading-relaxed line-clamp-3 mb-4">
                  {offer.description}
                </p>

                {/* Domains */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {offer.domains?.map((d) => (
                    <span
                      key={d.id}
                      className="text-[11px] bg-[#f0f3ff] text-[#4056c6] px-2.5 py-0.5 rounded-md font-medium"
                    >
                      {d.name}
                    </span>
                  ))}
                </div>

                {offer.opportunity_available && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Opportunity Tagged: {offer.opportunity_title} ({offer.opportunity_company})</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Offer Dialog Modal (Figma Style) */}
      {showCreateModal && (
        <div className="modal-wrap" role="dialog">
          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setShowCreateModal(false)}
            aria-label="Cancel offer modal"
          />
          <div className="dialog max-w-xl">
            <button
              type="button"
              className="x"
              onClick={() => setShowCreateModal(false)}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="font-heading text-xl text-[#15213b] mb-1">
              Publish New Mentoring Offer
            </h2>
            <p className="text-xs text-[#66758e] mb-4">
              Structured offers outline your guidance format, domains, and referral eligibility.
            </p>

            {error && (
              <div className="mb-4">
                <Alert variant="error" title="Form Error">
                  {error}
                </Alert>
              </div>
            )}

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="field">
                <label htmlFor="offerTitle">Offer title</label>
                <input
                  id="offerTitle"
                  type="text"
                  required
                  placeholder="e.g. Technical Interview Simulation & System Design Drill"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="offerHelpType">Help type offered</label>
                <select
                  id="offerHelpType"
                  required
                  value={helpTypeId}
                  onChange={(e) => setHelpTypeId(e.target.value)}
                >
                  {helpTypes.map((ht) => (
                    <option key={ht.id} value={ht.id}>
                      {ht.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supported Domains */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#15213b]">Supported domains</label>
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
                <label htmlFor="offerDesc">Description &amp; expectations</label>
                <textarea
                  id="offerDesc"
                  required
                  rows={3}
                  placeholder="Describe what you will cover, typical format (30-45 mins), and any preparation expectations."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Opportunity Tagging */}
              <div className="p-3 bg-[#f7f9fc] border border-[#e5eaf2] rounded-xl space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#15213b] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opportunityAvailable}
                    onChange={(e) => setOpportunityAvailable(e.target.checked)}
                    className="rounded border-[#cbd5fb] text-[#536df0]"
                  />
                  <span>Tag an available job opening or referral opportunity</span>
                </label>

                {opportunityAvailable && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="field">
                      <label htmlFor="oppTitle">Role title</label>
                      <input
                        id="oppTitle"
                        placeholder="e.g. APM 2027"
                        value={opportunityTitle}
                        onChange={(e) => setOpportunityTitle(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="oppCompany">Company</label>
                      <input
                        id="oppCompany"
                        placeholder="e.g. Stripe"
                        value={opportunityCompany}
                        onChange={(e) => setOpportunityCompany(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="dialog-actions pt-2 border-t border-[#edf0f5]">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" isLoading={createLoading}>
                  Publish Offer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
