"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    const errCode = searchParams.get("error_code");
    const errDesc = searchParams.get("error_description");

    if (err || errCode === "otp_expired" || (errDesc && errDesc.includes("expired"))) {
      setIsExpired(true);
      setError(errDesc || "Your password reset link has expired or is invalid.");
    }

    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (
        hashParams.get("error") ||
        hashParams.get("error_code") === "otp_expired" ||
        hashParams.get("error_description")?.includes("expired")
      ) {
        setIsExpired(true);
        setError(hashParams.get("error_description") || "Your password reset link has expired or is invalid.");
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setIsSuccess(true);
        setTimeout(() => router.push("/auth/sign-in"), 2500);
        return;
      }

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        if (updateError.message.includes("expired") || updateError.message.includes("session")) {
          setIsExpired(true);
        }
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => router.push("/auth/sign-in"), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please request a new reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (isExpired) {
    return (
      <div className="auth-main min-h-[85vh] py-12 px-4">
        <div className="auth-card text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 rounded-2xl bg-amber-100 items-center justify-center text-amber-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#15213b] mb-2">
            Reset Link Expired
          </h2>
          <p className="text-xs text-[#66758e] mb-6">
            For security, password reset links expire after a short time or once used.
          </p>

          <Alert variant="warning" title="Link Expired">
            {error || "This recovery link has expired. Please request a new one."}
          </Alert>

          <div className="mt-6 space-y-3">
            <Link href="/auth/forgot-password" className="block w-full">
              <Button variant="primary" className="w-full">
                <span>Request New Reset Link</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/auth/sign-in" className="text-xs text-[#3563ff] hover:underline font-semibold block">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-main min-h-[85vh] py-12 px-4">
      <div className="auth-card">
        <Link href="/auth/sign-in" className="back inline-flex items-center gap-2 text-sm text-[#66758e] hover:text-[#15213b] mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>

        <h2 className="font-heading text-2xl font-bold text-[#15213b] mb-1">
          Set New Password
        </h2>
        <p className="text-sm text-[#66758e] mb-6">
          Please choose a strong password for your account.
        </p>

        {isSuccess ? (
          <div className="space-y-4 text-center py-4">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-emerald-100 text-emerald-600 items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-[#15213b]">Password Updated!</h3>
            <p className="text-xs text-[#66758e]">
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="error" title="Password Update Failed">
                {error}
              </Alert>
            )}

            <div className="field">
              <label htmlFor="newPass">New password (min 6 characters)</label>
              <input
                id="newPass"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPass">Confirm new password</label>
              <input
                id="confirmPass"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" className="w-full gap-2 mt-2" isLoading={loading}>
              <Lock className="h-4 w-4" />
              <span>Update Password</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-[#66758e]">Loading reset page...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
