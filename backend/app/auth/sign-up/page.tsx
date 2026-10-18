"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Briefcase, ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { OAuthSetupModal } from "@/components/auth/oauth-setup-modal";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  calculateStudyYear,
  GRADUATION_MONTHS,
  getGraduationYearOptions,
} from "@/lib/students/study-year";

// Official Google "G" SVG Icon
function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as "student" | "alum") || "student";

  const [role, setRole] = useState<"student" | "alum">(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [gradMonth, setGradMonth] = useState<number>(5); // Default May
  const [gradYear, setGradYear] = useState<number>(2028); // Default 3rd Year
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [providerNotConfigured, setProviderNotConfigured] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState<"google" | null>(null);
  const [demoLoginLoading, setDemoLoginLoading] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  // Dynamically compute student study year based on expected graduation date
  const computedStudyYear = useMemo(() => {
    return calculateStudyYear(gradMonth, gradYear);
  }, [gradMonth, gradYear]);

  // Handle standard email/password registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProviderNotConfigured(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        // Standalone demo fallback
        router.push(`/onboarding?role=${role}&name=${encodeURIComponent(fullName)}`);
        return;
      }

      const supabase = createClient();

      // 1. First attempt resilient server-side registration (bypasses Supabase SMTP rate limits)
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            fullName,
            role,
            expectedGraduationYear: role === "student" ? gradYear : null,
            expectedGraduationMonth: role === "student" ? gradMonth : null,
          }),
        });

        const regData = await res.json();

        if (res.ok && regData.success) {
          // Immediately establish authenticated session
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!signInErr) {
            router.push(
              `/onboarding?role=${role}&name=${encodeURIComponent(fullName)}&gradYear=${gradYear}&gradMonth=${gradMonth}&studyYear=${computedStudyYear.studyYear}`
            );
            return;
          } else {
            // Account created, redirect to sign-in
            router.push(`/auth/sign-in?email=${encodeURIComponent(email)}`);
            return;
          }
        } else if (res.status === 409 || regData.error?.includes("already exists")) {
          setError(regData.error || "An account with this email address already exists. Please sign in instead.");
          setLoading(false);
          return;
        } else if (res.status === 400) {
          setError(regData.error || "Invalid registration information provided.");
          setLoading(false);
          return;
        }
      } catch (apiErr) {
        console.warn("Direct register API call failed, falling back to standard auth:", apiErr);
      }

      // 2. Fallback to standard Supabase client signup if API route was unreachable
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            study_year: role === "student" ? computedStudyYear.studyYear : null,
            expected_graduation_year: role === "student" ? gradYear : null,
            expected_graduation_month: role === "student" ? gradMonth : null,
          },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("rate limit")) {
          setError("Supabase email rate limit exceeded. Please wait a few moments or try signing in directly.");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // If email confirmation is enabled and session was not immediately established
      if (data?.user && !data.session) {
        setConfirmationSent(true);
        setLoading(false);
        return;
      }

      // If session exists immediately, proceed to profile onboarding
      router.push(
        `/onboarding?role=${role}&name=${encodeURIComponent(fullName)}&gradYear=${gradYear}&gradMonth=${gradMonth}&studyYear=${computedStudyYear.studyYear}`
      );
    } catch {
      router.push(
        `/onboarding?role=${role}&name=${encodeURIComponent(fullName)}&gradYear=${gradYear}&gradMonth=${gradMonth}&studyYear=${computedStudyYear.studyYear}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth Registration / Sign-In (Google only)
  const handleOAuthSignUp = async () => {
    setError(null);
    setProviderNotConfigured(null);
    setOauthLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setProviderNotConfigured("Google OAuth");
        setOauthLoading(false);
        return;
      }

      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback?next=${role === "alum" ? "/alumni/dashboard" : "/student/dashboard"}`;

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        if (
          oauthError.message.toLowerCase().includes("not enabled") ||
          oauthError.message.toLowerCase().includes("provider is not configured") ||
          oauthError.message.toLowerCase().includes("unsupported provider")
        ) {
          setProviderNotConfigured("Google OAuth");
        } else {
          setError(oauthError.message);
        }
        setOauthLoading(false);
        return;
      }

      if (data?.url) {
        // Pre-flight probe to verify if provider is enabled in Supabase without sending user to a raw JSON 400 error page
        try {
          const probe = await fetch(data.url, { method: "GET", redirect: "manual" });
          if (probe.status === 400) {
            const errJson = await probe.json().catch(() => null);
            if (
              errJson?.error_code === "validation_failed" ||
              errJson?.msg?.toLowerCase().includes("provider is not enabled")
            ) {
              setProviderNotConfigured("Google OAuth");
              setOauthLoading(false);
              return;
            }
          }
        } catch {
          // If browser CORS prevents following redirect, provider is active and redirecting to OAuth consent screen
        }

        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err?.message || "Failed to initiate registration.");
      setOauthLoading(false);
    }
  };

  // One-click pilot session authentication for demo social profiles
  const handleDemoSocialLogin = async () => {
    setError(null);
    setDemoLoginLoading("google");
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "google", role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize demo session");
      }

      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInErr) throw signInErr;

      router.push(`/onboarding?role=${data.role}&name=${encodeURIComponent(data.fullName)}`);
    } catch (err: any) {
      setError(err?.message || "Demo registration failed. Please try again.");
    } finally {
      setDemoLoginLoading(null);
    }
  };

  if (confirmationSent) {
    return (
      <div className="auth-page">
        <aside className="auth-side">
          <Link href="/" className="inline-flex items-center">
            <BrandLogo size="md" withText textColor="text-white" />
          </Link>
          <div>
            <span className="badge dark mb-4 inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Account verification
            </span>
            <h1 className="font-heading">One step away from connecting.</h1>
            <p>We believe in high-signal, authentic relationships between alumni and emerging talent.</p>
          </div>
          <small>Open to all students &amp; professionals · Any valid email accepted</small>
        </aside>

        <main className="auth-main">
          <div className="auth-card text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 rounded-2xl bg-emerald-100 items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#15213b] mb-2 font-heading">
              Check your email
            </h2>
            <p className="text-sm text-[#66758e] mb-6">
              We&apos;ve sent a verification link to{" "}
              <span className="font-semibold text-[#15213b]">{email}</span>.
            </p>
            <p className="text-xs text-[#8896ab] mb-6">
              Please click the link in your email to activate your account. You do not need an
              institutional or college email address to join.
            </p>
            <Link href="/auth/sign-in" className="w-full">
              <Button variant="primary" className="w-full">
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Brand Panel Side (Figma Style) */}
      <aside className="auth-side">
        <Link href="/" className="inline-flex items-center">
          <BrandLogo size="md" withText textColor="text-white" badge="Pilot" />
        </Link>

        <div>
          <span className="badge dark mb-4 inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Intent-based networking
          </span>
          <h1 className="font-heading">A better way to find the person who can help.</h1>
          <p>Start with a goal. Meet alumni with the right experience, availability, and context.</p>
        </div>

        <small>Transparent matching · Measurable progress · Verified identities</small>
      </aside>

      {/* Main Form Area */}
      <main className="auth-main">
        <div className="auth-card">
          <Link href="/" className="back inline-flex items-center gap-2 text-sm text-[#66758e] hover:text-[#15213b] mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          {/* Mode Switch Tabs */}
          <div className="auth-tabs">
            <Link
              href="/auth/sign-in"
              className="flex items-center justify-center text-sm font-bold text-[#66758e] hover:text-[#15213b]"
            >
              Sign in
            </Link>
            <button type="button" className="active">
              Create account
            </button>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#15213b] mb-1 font-heading">
            Create your account
          </h2>
          <p className="text-sm text-[#66758e] mb-6">
            Begin with a few details, then personalize your goals.
          </p>

          {error && (
            <div className="mb-4">
              <Alert variant="error" title="Sign Up Error">
                {error}
              </Alert>
            </div>
          )}

          {providerNotConfigured && (
            <div className="mb-4">
              <Alert variant="warning" title={`${providerNotConfigured} Setup Required`}>
                <p className="mb-3 text-xs leading-relaxed text-amber-900">
                  {providerNotConfigured} credentials are not configured in your Supabase project yet. You can register immediately using a pilot test profile or view the setup steps to connect your Google Cloud app.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    type="button"
                    isLoading={demoLoginLoading === "google"}
                    onClick={handleDemoSocialLogin}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span>Instant Join as Google User</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    className="text-xs border-amber-300 text-amber-900 hover:bg-amber-100"
                    onClick={() => setShowSetupGuide("google")}
                  >
                    <span>Google OAuth Setup Steps</span>
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          {/* Role Selection Toggle */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[#66758e] uppercase tracking-wider mb-2">
              I am joining as a
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                  role === "student"
                    ? "border-[#3563ff] bg-[#edf1ff] text-[#3563ff] shadow-sm"
                    : "border-[#e5eaf2] text-[#66758e] hover:bg-[#f7f9fc]"
                }`}
              >
                <GraduationCap className="h-5 w-5 mb-1.5 text-[#3563ff]" />
                <span>Student</span>
                <span className="text-[11px] text-[#8896ab] font-normal mt-0.5">1st, 2nd, 3rd, or 4th Year</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("alum")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-sm font-semibold transition-all ${
                  role === "alum"
                    ? "border-[#7c5ce7] bg-[#f5f0ff] text-[#7c5ce7] shadow-sm"
                    : "border-[#e5eaf2] text-[#66758e] hover:bg-[#f7f9fc]"
                }`}
              >
                <Briefcase className="h-5 w-5 mb-1.5 text-[#7c5ce7]" />
                <span>Alumnus</span>
                <span className="text-[11px] text-[#8896ab] font-normal mt-0.5">Working Professional</span>
              </button>
            </div>
          </div>

          {/* Social OAuth Button (Google Only) */}
          <div className="provider-row w-full flex flex-col items-stretch">
            <Button
              type="button"
              variant="provider"
              className="w-full justify-center gap-2.5 h-11"
              onClick={handleOAuthSignUp}
              isLoading={oauthLoading}
              disabled={loading || oauthLoading}
            >
              <GoogleIcon className="h-4 w-4" />
              <span>Continue with Google</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="divider">
            <span>or register with email</span>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                required
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password (min 6 characters)</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8896ab] hover:text-[#15213b] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Student Expected Graduation Month & Year (Auto-determines Study Year) */}
            {role === "student" && (
              <div className="p-3.5 rounded-xl bg-[#f5f8ff] border border-[#d8e2fd] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#15213b] flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-[#3563ff]" />
                    <span>Expected Graduation Date</span>
                  </label>
                  <span className="badge soft text-[11px] font-bold text-[#3563ff] bg-white border-[#d8e2fd]">
                    {computedStudyYear.badgeLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-[#66758e] block mb-1">Month</label>
                    <select
                      value={gradMonth}
                      onChange={(e) => setGradMonth(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-[#cfd8ea] bg-white py-2 px-2.5 text-[#15213b] focus:outline-none focus:border-[#3563ff]"
                    >
                      {GRADUATION_MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#66758e] block mb-1">Year</label>
                    <select
                      value={gradYear}
                      onChange={(e) => setGradYear(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-[#cfd8ea] bg-white py-2 px-2.5 text-[#15213b] focus:outline-none focus:border-[#3563ff]"
                    >
                      {getGraduationYearOptions().map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[11.5px] text-[#4d5fd3] bg-white/90 p-2.5 rounded-lg border border-[#e1e9ff] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#3563ff]" />
                  <span>
                    Your account will be designated as <b>{computedStudyYear.label}</b> ({computedStudyYear.description})
                  </span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full gap-2 mt-2"
              isLoading={loading}
              disabled={oauthLoading}
            >
              <span>Continue to Profile Setup</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <small className="terms">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </small>

          <div className="mt-6 text-center text-xs text-[#66758e]">
            Already have an account?{" "}
            <Link href="/auth/sign-in" className="text-[#3563ff] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* OAuth Supabase Configuration Guidance Modal */}
      {showSetupGuide && (
        <OAuthSetupModal
          provider={showSetupGuide}
          onClose={() => setShowSetupGuide(null)}
          onInstantLogin={() => {
            setShowSetupGuide(null);
            handleDemoSocialLogin();
          }}
        />
      )}
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#66758e]">Loading sign-up...</div>}>
      <SignUpForm />
    </Suspense>
  );
}
