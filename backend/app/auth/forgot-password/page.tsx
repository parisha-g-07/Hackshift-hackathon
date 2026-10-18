"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setSubmitted(true);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-main min-h-[85vh] py-12 px-4">
      <div className="auth-card">
        <Link href="/auth/sign-in" className="back inline-flex items-center gap-2 text-sm text-[#66758e] hover:text-[#15213b] mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>

        <h2 className="font-heading text-2xl font-bold text-[#15213b] mb-1">
          Forgot your password?
        </h2>
        <p className="text-sm text-[#66758e] mb-6">
          Enter your account email and we&apos;ll send you a link to reset your password.
        </p>

        {submitted ? (
          <div className="space-y-4 text-center py-4">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-600 items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-[#15213b]">Check your inbox</h3>
            <p className="text-xs text-[#66758e] leading-relaxed">
              If an account exists for <span className="font-semibold text-[#15213b]">{email}</span>, you will receive password reset instructions shortly.
            </p>

            <div className="pt-3">
              <Button variant="secondary" size="sm" onClick={() => setSubmitted(false)}>
                Try another email
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <Alert variant="error" title="Reset Request Failed">
                {error}
              </Alert>
            )}

            <div className="field">
              <label htmlFor="resetEmail">Email address</label>
              <input
                id="resetEmail"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full gap-2 mt-2" isLoading={loading}>
              <Mail className="h-4 w-4" />
              <span>Send Reset Instructions</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
