"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, AlertTriangle, CheckCircle2, RotateCw, ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { OAuthSetupModal } from "@/components/auth/oauth-setup-modal";
import { BrandLogo } from "@/components/ui/brand-logo";

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



function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [providerNotConfigured, setProviderNotConfigured] = useState<string | null>(null);
  const [showSetupGuide, setShowSetupGuide] = useState<"google" | null>(null);
  const [demoLoginLoading, setDemoLoginLoading] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Check query params for error or cancellation states from OAuth redirect
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const cancelledParam = searchParams.get("cancelled");
    const confirmationParam = searchParams.get("confirmation_needed");

    if (cancelledParam === "true" || errorParam === "access_denied") {
      setError("Sign-in with external provider was cancelled.");
    } else if (errorParam) {
      setError(errorParam);
    }

    if (confirmationParam === "true") {
      setNeedsConfirmation(true);
    }
  }, [searchParams]);

  // Handle standard email/password authentication
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProviderNotConfigured(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        // Standalone pilot fallback mode
        if (email.toLowerCase().includes("alum")) {
          router.push("/alumni/dashboard");
        } else {
          router.push("/student/dashboard");
        }
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (
          signInError.message.toLowerCase().includes("email not confirmed") ||
          signInError.message.toLowerCase().includes("not verified")
        ) {
          setNeedsConfirmation(true);
          setError("Your email address has not been confirmed yet. Please check your inbox or resend the link below.");
        } else if (signInError.message.toLowerCase().includes("invalid login credentials")) {
          setError("Invalid email address or password. Please verify your credentials.");
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      // Successful login: route based on user profile
      const res = await fetch("/api/profile");
      const profileData = await res.json();
      if (profileData?.profile?.role === "alum") {
        router.push("/alumni/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch {
      // Local demo fallback
      if (email.toLowerCase().includes("alum")) {
        router.push("/alumni/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth Sign-In (Google)
  const handleOAuthSignIn = async () => {
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
      const redirectTo = `${origin}/auth/callback`;

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
      setError(err?.message || "Failed to initiate Google sign-in.");
      setOauthLoading(false);
    }
  };

  // Resend confirmation email
  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address to resend confirmation.");
      return;
    }
    setResendingConfirmation(true);
    setResendSuccess(false);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
      }
    } catch {
      setResendSuccess(true);
    } finally {
      setResendingConfirmation(false);
    }
  };

  // One-click pilot session authentication for demo social profiles and quick test roles
  const handleDemoSocialLogin = async (type: "google" | "student" | "alum") => {
    setError(null);
    setDemoLoginLoading(type);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
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

      if (data.role === "alum") {
        router.push("/alumni/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Demo login failed. Please try again.");
    } finally {
      setDemoLoginLoading(null);
    }
  };

  const handleDemoLogin = (role: "student" | "alum") => {
    handleDemoSocialLogin(role);
  };

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
            <button type="button" className="active">
              Sign in
            </button>
            <Link
              href="/auth/sign-up"
              className="flex items-center justify-center text-sm font-bold text-[#66758e] hover:text-[#15213b]"
            >
              Create account
            </Link>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-[#15213b] mb-1 font-heading">
            Welcome back
          </h2>
          <p className="text-sm text-[#66758e] mb-6">
            Continue where you left off.
          </p>

          {error && (
            <div className="mb-4">
              <Alert variant="error" title="Sign In Error">
                {error}
              </Alert>
            </div>
          )}

          {providerNotConfigured && (
            <div className="mb-4">
              <Alert variant="warning" title={`${providerNotConfigured} Setup Required`}>
                <p className="mb-3 text-xs leading-relaxed text-amber-900">
                  {providerNotConfigured} credentials are not configured in your Supabase Auth dashboard yet. You can sign in immediately using a pilot test profile or view the setup steps to connect your Google Cloud app.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    type="button"
                    isLoading={demoLoginLoading === "google"}
                    onClick={() => handleDemoSocialLogin("google")}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span>Instant Login as Google User</span>
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

          {needsConfirmation && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2.5 mb-4">
              <div className="flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Email confirmation is required. Check your inbox or request a new confirmation link.</span>
              </div>
              {resendSuccess ? (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Confirmation email resent successfully.
                </p>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-amber-900 border-amber-300 hover:bg-amber-100"
                  onClick={handleResendConfirmation}
                  isLoading={resendingConfirmation}
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  Resend Confirmation Email
                </Button>
              )}
            </div>
          )}

          {/* Social OAuth Button */}
          <div className="provider-row w-full flex flex-col items-stretch">
            <Button
              type="button"
              variant="provider"
              className="w-full justify-center gap-2.5 h-11"
              onClick={handleOAuthSignIn}
              isLoading={oauthLoading}
              disabled={loading || oauthLoading}
            >
              <GoogleIcon className="h-4 w-4" />
              <span>Continue with Google</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="divider">
            <span>or continue with email</span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label htmlFor="password">Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[#3563ff] hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
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

            <Button
              type="submit"
              variant="primary"
              className="w-full gap-2 mt-2"
              isLoading={loading}
              disabled={oauthLoading !== null}
            >
              <Mail className="h-4 w-4" />
              <span>Sign In with Email</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Pilot Access */}
          <div className="mt-8 pt-6 border-t border-[#edf0f5]">
            <p className="text-[11px] font-semibold text-[#8896ab] uppercase tracking-wider mb-2.5 text-center">
              Quick Test Pilot Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin("student")}
                isLoading={demoLoginLoading === "student"}
                disabled={demoLoginLoading !== null}
                className="text-xs"
              >
                Sign In as Student
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin("alum")}
                isLoading={demoLoginLoading === "alum"}
                disabled={demoLoginLoading !== null}
                className="text-xs"
              >
                Sign In as Alumnus
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-[#66758e]">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-[#3563ff] font-semibold hover:underline">
              Create an account
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
            const p = showSetupGuide;
            setShowSetupGuide(null);
            handleDemoSocialLogin(p);
          }}
        />
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#66758e]">Loading sign-in...</div>}>
      <SignInContent />
    </Suspense>
  );
}
