"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Compass, Award, User, LogOut, ArrowRight, Menu, X, Sparkles, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/ui/brand-logo";

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ role?: string; full_name?: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Dedicated standalone layouts: Auth screens and onboarding wizard have their own clean viewports
  const isAuthRoute = pathname.startsWith("/auth") || pathname.startsWith("/onboarding");

  useEffect(() => {
    if (isAuthRoute) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        fetch("/api/profile")
          .then((r) => r.json())
          .then((d) => {
            if (d?.profile) setProfile(d.profile);
          })
          .catch(() => {});
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [isAuthRoute]);

  if (isAuthRoute) {
    return null;
  }

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/sign-in";
  };

  const isPortalRoute =
    pathname.startsWith("/student") ||
    pathname.startsWith("/alumni") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/opportunities") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/impact");

  if (isPortalRoute) {
    return null;
  }

  const isStudentPortal = pathname.startsWith("/student") || profile?.role === "student";
  const isAlumPortal = pathname.startsWith("/alumni") || profile?.role === "alum";
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--line-soft)] bg-[rgba(255,255,255,0.82)] backdrop-blur-xl">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 flex h-[74px] items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center">
            <BrandLogo size="md" withText badge="Pilot" />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {isPortalRoute || user ? (
              <>
                {isStudentPortal && !pathname.startsWith("/alumni") && (
                  <>
                    <Link
                      href="/student/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        pathname.startsWith("/student/dashboard")
                          ? "bg-[#edf1ff] text-[#3563ff] font-semibold"
                          : "text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb]"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/student/intents"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        pathname.startsWith("/student/intents")
                          ? "bg-[#edf1ff] text-[#3563ff] font-semibold"
                          : "text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb]"
                      }`}
                    >
                      Intents
                    </Link>
                    <Link
                      href="/student/requests"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        pathname.startsWith("/student/requests")
                          ? "bg-[#edf1ff] text-[#3563ff] font-semibold"
                          : "text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb]"
                      }`}
                    >
                      My Requests
                    </Link>
                  </>
                )}

                {(isAlumPortal || pathname.startsWith("/alumni")) && (
                  <>
                    <Link
                      href="/alumni/dashboard"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        pathname.startsWith("/alumni/dashboard")
                          ? "bg-[#edf1ff] text-[#3563ff] font-semibold"
                          : "text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb]"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/alumni/offers"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        pathname.startsWith("/alumni/offers")
                          ? "bg-[#edf1ff] text-[#3563ff] font-semibold"
                          : "text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb]"
                      }`}
                    >
                      My Offers
                    </Link>
                    <Link
                      href="/alumni/requests"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        pathname.startsWith("/alumni/requests")
                          ? "bg-[#edf1ff] text-[#3563ff] font-semibold"
                          : "text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb]"
                      }`}
                    >
                      Connection Requests
                    </Link>
                  </>
                )}

                <Link
                  href="/impact"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    pathname === "/impact"
                      ? "bg-[#edf1ff] text-[#3563ff] font-semibold"
                      : "text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb]"
                  }`}
                >
                  Impact Metrics
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/#how-it-works"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb] transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  href="/#matching"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb] transition-colors"
                >
                  Matching Engine
                </Link>
                <Link
                  href="/impact"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#66758e] hover:text-[#15213b] hover:bg-[#f3f5fb] transition-colors"
                >
                  Impact
                </Link>
              </>
            )}
          </nav>
        </div>
        {/* Auth / Profile CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <Link href="/profile" className="flex items-center gap-2 text-[#15213b] hover:opacity-85 transition-opacity">
                <span className={`avatar ${isAlumPortal ? "violet" : "cyan"} w-8 h-8 text-[11px]`}>{initials}</span>
                <span className="text-sm font-semibold">{profile?.full_name || "Profile"}</span>
                {profile?.role && (
                  <span className="badge soft text-[11px] py-0 px-2 capitalize">{profile.role}</span>
                )}
              </Link>
              <button
                onClick={handleSignOut}
                className="btn ghost text-xs text-[#66758e] hover:text-[#c44f5a] py-1.5 px-2.5 min-h-[34px] ml-2"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : isPortalRoute ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/auth/sign-in" className="btn secondary text-xs min-h-[38px] px-4">
                Sign In
              </Link>
              <Link href="/auth/sign-up" className="btn text-xs min-h-[38px] px-4 gap-1.5">
                <span>Join SyncTies</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#66758e] hover:text-[#15213b] hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--line)] bg-white/95 backdrop-blur-lg px-4 pt-2 pb-4 space-y-1.5 animate-page-enter">
          {isPortalRoute || user ? (
            <>
              {isStudentPortal && !pathname.startsWith("/alumni") && (
                <>
                  <Link
                    href="/student/dashboard"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-[#15213b] hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/student/intents"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-[#15213b] hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Intents
                  </Link>
                  <Link
                    href="/student/requests"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-[#15213b] hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Requests
                  </Link>
                </>
              )}
              {(isAlumPortal || pathname.startsWith("/alumni")) && (
                <>
                  <Link
                    href="/alumni/dashboard"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-[#15213b] hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/alumni/offers"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-[#15213b] hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Offers
                  </Link>
                  <Link
                    href="/alumni/requests"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-[#15213b] hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Connection Requests
                  </Link>
                </>
              )}
              <Link
                href="/impact"
                className="block px-3 py-2 rounded-lg text-base font-medium text-[#15213b] hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Impact Metrics
              </Link>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-lg text-base font-medium text-[#15213b] hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile ({profile?.full_name || user.email})
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-[#c44f5a] hover:bg-rose-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Link
                href="/#how-it-works"
                className="block px-3 py-2 rounded-lg text-base font-medium text-[#66758e] hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/impact"
                className="block px-3 py-2 rounded-lg text-base font-medium text-[#66758e] hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Impact
              </Link>
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/auth/sign-in" onClick={() => setMobileMenuOpen(false)}>
                  <span className="btn secondary w-full">Sign In</span>
                </Link>
                <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  <span className="btn w-full">Join SyncTies</span>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
