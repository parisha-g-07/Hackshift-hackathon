"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Database, X, ChevronRight, Check } from "lucide-react";

export function ConfigBanner() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDismissed = sessionStorage.getItem("syncties_config_banner_dismissed");
      if (isDismissed === "true") {
        setDismissed(true);
      }
    }

    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setIsConfigured(data.supabaseConfigured);
      })
      .catch(() => {
        setIsConfigured(false);
      });
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("syncties_config_banner_dismissed", "true");
    }
  };

  if (dismissed || isConfigured === null || isConfigured === true) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 px-4 py-2.5 text-amber-900 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>Standalone Demo Mode Active:</strong> SyncTies is running with preloaded student &amp; alumni pilot data.
          </span>
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-0.5 text-blue-700 hover:text-blue-900 font-medium underline underline-offset-2 ml-1 cursor-pointer"
          >
            <span>{showGuide ? "Hide Setup Guide" : "Connect Live Supabase"}</span>
            <ChevronRight className={`h-3 w-3 transition-transform ${showGuide ? "rotate-90" : ""}`} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs border border-amber-200">
            <Check className="h-3 w-3 text-emerald-600" /> Fully Functional Local Demo
          </span>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="p-1 rounded text-amber-700 hover:text-amber-900 hover:bg-amber-100/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="max-w-7xl mx-auto mt-2.5 pt-2.5 border-t border-amber-200/60 text-xs text-slate-700 space-y-2 bg-white/80 p-3 rounded-md">
          <p className="font-semibold text-slate-900">How to connect your live Supabase database in 3 steps:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
            <li>
              Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">supabase.com</a>.
            </li>
            <li>
              Go to the <strong>SQL Editor</strong> in Supabase, paste and run the consolidated migration script: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">supabase/full_schema.sql</code>.
            </li>
            <li>
              Add your credentials in <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">.env.local</code>:
              <pre className="bg-slate-900 text-slate-100 p-2 rounded mt-1 overflow-x-auto font-mono text-[11px]">
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co&#10;NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key&#10;SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
              </pre>
            </li>
          </ol>
          <p className="text-[11px] text-slate-500 italic">
            Note: You can continue exploring all student and alumnus features in Standalone Demo Mode right now without setting up Supabase.
          </p>
        </div>
      )}
    </div>
  );
}
