"use client";

import React, { useState } from "react";
import { X, Copy, Check, ExternalLink, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OAuthSetupModalProps {
  provider?: "google";
  onClose: () => void;
  onInstantLogin: () => void;
}

export function OAuthSetupModal({
  onClose,
  onInstantLogin,
}: OAuthSetupModalProps) {
  const [copied, setCopied] = useState(false);
  const callbackUrl = "https://dvlmiwonanctdbvjgjto.supabase.co/auth/v1/callback";
  const supabaseDashboardUrl = "https://supabase.com/dashboard/project/dvlmiwonanctdbvjgjto/auth/providers";

  const handleCopy = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Close setup modal"
      />
      <div className="dialog max-w-lg">
        <button
          type="button"
          className="x"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <span className="badge soft text-xs py-1 px-2.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#3563ff]" /> Supabase Provider Configuration
          </span>
        </div>

        <h2 className="font-heading text-xl text-[#15213b] mb-1.5">
          Enable Google OAuth
        </h2>
        <p className="text-xs text-[#66758e] mb-4 leading-relaxed">
          Follow these 3 quick steps to connect real Google sign-in to your Supabase project.
        </p>

        {/* Step 1: Callback URL */}
        <div className="space-y-3 mb-5">
          <div className="p-3 bg-[#f7f9fc] border border-[#e5eaf2] rounded-xl text-xs space-y-1.5">
            <span className="font-semibold text-[#15213b] block">
              1. Authorized Redirect URI (for Google Cloud Console):
            </span>
            <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#dde3ee] font-mono text-[11px] text-[#2d3c62]">
              <span className="truncate">{callbackUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[#3563ff] hover:text-[#2141c7] font-sans font-semibold shrink-0 text-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Step 2: Developer Console */}
          <div className="p-3 bg-[#f7f9fc] border border-[#e5eaf2] rounded-xl text-xs space-y-1 text-[#455470]">
            <span className="font-semibold text-[#15213b] block">
              2. Create Credentials in Google Cloud:
            </span>
            <p className="leading-relaxed">
              Visit{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-[#3563ff] font-semibold underline inline-flex items-center gap-0.5"
              >
                Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>
              , create an <b>OAuth 2.0 Client ID (Web Application)</b>, add the Redirect URI above, and copy your Client ID &amp; Secret.
            </p>
          </div>

          {/* Step 3: Supabase Dashboard */}
          <div className="p-3 bg-[#f7f9fc] border border-[#e5eaf2] rounded-xl text-xs space-y-1 text-[#455470]">
            <span className="font-semibold text-[#15213b] block">
              3. Paste Credentials in Supabase Dashboard:
            </span>
            <p className="leading-relaxed">
              Open your{" "}
              <a
                href={supabaseDashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#3563ff] font-semibold underline inline-flex items-center gap-0.5"
              >
                Supabase Auth Providers <ExternalLink className="h-3 w-3" />
              </a>
              , enable <b>Google</b>, paste your Client ID &amp; Secret, and click <b>Save</b>.
            </p>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="dialog-actions pt-3 border-t border-[#edf0f5] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <Button
            variant="primary"
            size="sm"
            type="button"
            className="w-full sm:w-auto"
            onClick={onInstantLogin}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>1-Click Test as Google User</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            type="button"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Close Guide
          </Button>
        </div>
      </div>
    </div>
  );
}
