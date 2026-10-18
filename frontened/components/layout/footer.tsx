"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Cpu, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export function Footer() {
  const pathname = usePathname();

  // Hide the marketing footer on auth flows, onboarding wizard, and internal portal dashboards
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/alumni") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/opportunities") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/impact")
  ) {
    return null;
  }

  return (
    <footer className="border-t border-[var(--line-soft)] bg-white/80 backdrop-blur-md mt-auto text-[var(--muted)] text-sm">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3.5">
            <Link href="/" className="inline-flex items-center">
              <BrandLogo size="md" withText />
            </Link>
            <p className="text-[#66758e] max-w-md text-sm leading-relaxed">
              Purposeful alumni connections for career momentum. Built with explainable matching, mentor-controlled
              capacity, and mutually confirmed goal fulfillment.
            </p>
            <div className="flex items-center flex-wrap gap-4 text-xs text-[#94a1b5] pt-2">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#3563ff]" /> Privacy by Default
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-[#7c5ce7]" /> SQL-Scored Matching
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#38b9d8]" /> Grounded AI Briefs
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#15213b] mb-3 text-sm font-heading">Platform</h4>
            <ul className="space-y-2 text-sm text-[#66758e]">
              <li>
                <Link href="/student/dashboard" className="hover:text-[#3563ff] transition-colors">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link href="/alumni/dashboard" className="hover:text-[#3563ff] transition-colors">
                  Alumni Hub
                </Link>
              </li>
              <li>
                <Link href="/impact" className="hover:text-[#3563ff] transition-colors">
                  Impact Dashboard
                </Link>
              </li>
              <li>
                <Link href="/#matching" className="hover:text-[#3563ff] transition-colors">
                  Matching Transparency
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#15213b] mb-3 text-sm font-heading">Pilot Governance</h4>
            <ul className="space-y-2.5 text-xs text-[#66758e]">
              <li>
                <span className="badge soft text-[11px]">
                  Cohort: 3rd &amp; 4th Year Undergrads
                </span>
              </li>
              <li>
                <span className="badge text-[11px]">
                  Alumni: Recent 3 Graduating Batches
                </span>
              </li>
              <li>
                <span className="badge success text-[11px]">
                  Tokens: 5 / month (Refresh monthly)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--line-soft)] flex flex-col sm:flex-row items-center justify-between text-xs text-[#94a1b5] gap-4">
          <p>© 2026 SyncTies · Outcome-driven alumni networking platform.</p>
          <p>Deterministic Formula: 40% Domain + 30% Help Fit + 20% Capacity + 10% Recency</p>
        </div>
      </div>
    </footer>
  );
}
