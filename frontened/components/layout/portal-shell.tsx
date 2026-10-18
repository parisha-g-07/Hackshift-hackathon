"use client";

import React, { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Inbox,
  Target,
  Briefcase,
  BarChart3,
  User,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getMentorTier } from "@/lib/mentors/tiers";
import { BrandLogo } from "@/components/ui/brand-logo";
import { getStudyYearLabel } from "@/lib/students/study-year";

interface PortalShellProps {
  children: ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{
    role?: string;
    full_name?: string;
    institution?: string;
    study_year?: number | null;
  } | null>(null);
  const [tokens, setTokens] = useState<{
    tokens_remaining: number;
    tokens_granted: number;
  } | null>(null);
  const [capacity, setCapacity] = useState<{
    monthly_limit: number;
    current_month_requests: number;
  } | null>(null);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
      }
    });

    // Fetch live profile
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.profile) {
          setProfile(d.profile);
          if (d.profile.role === "student") {
            fetch("/api/tokens/balance")
              .then((r) => r.json())
              .then((t) => setTokens(t))
              .catch(() => {});
            fetch("/api/connection-requests?role=student")
              .then((r) => r.json())
              .then((res) => {
                if (res?.requests) setRequestCount(res.requests.length);
              })
              .catch(() => {});
          } else {
            fetch("/api/capacity")
              .then((r) => r.json())
              .then((c) => setCapacity(c))
              .catch(() => {});
            fetch("/api/connection-requests?role=alum")
              .then((r) => r.json())
              .then((res) => {
                if (res?.requests) setRequestCount(res.requests.length);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/sign-in";
  };

  const isAlum = profile?.role === "alum" || pathname.startsWith("/alumni");
  const tier = getMentorTier(1);
  const rawName =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    (isAlum ? "Paris" : "Jordan");
  const cleanName = rawName.replace(/\s*\((student|alum|alumni|mentor|google|linkedin)\)/gi, "").trim();
  const displayName = cleanName || rawName;
  const initial = (displayName[0] || (isAlum ? "P" : "J")).toUpperCase();

  // Navigation config based on role
  const navItems = [
    {
      label: "Overview",
      href: isAlum ? "/alumni/dashboard" : "/student/dashboard",
      icon: Home,
      isActive:
        pathname === "/alumni/dashboard" ||
        pathname === "/student/dashboard" ||
        pathname === "/dashboard",
    },
    {
      label: "Discover Matches",
      href: isAlum ? "/alumni/requests" : "/student/matches",
      icon: Users,
      isActive: pathname.startsWith("/student/matches"),
    },
    {
      label: "My Requests",
      href: isAlum ? "/alumni/requests" : "/student/requests",
      icon: Inbox,
      isActive:
        pathname.startsWith("/student/requests") ||
        pathname.startsWith("/alumni/requests"),
      count: requestCount > 0 ? requestCount : undefined,
    },
    {
      label: "Goals",
      href: isAlum ? "/goals/1" : "/student/intents",
      icon: Target,
      isActive:
        pathname.startsWith("/goals") || pathname.startsWith("/student/intents"),
    },
    {
      label: "Opportunities",
      href: "/opportunities",
      icon: Briefcase,
      isActive:
        pathname.startsWith("/opportunities") ||
        pathname.startsWith("/alumni/offers"),
    },
    {
      label: "Impact",
      href: "/impact",
      icon: BarChart3,
      isActive: pathname.startsWith("/impact"),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: User,
      isActive: pathname === "/profile",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
    },
  ];

  // Token & Capacity calculations
  const monthlyLimit = capacity?.monthly_limit || 5;
  const usedRequests = capacity?.current_month_requests || 0;
  const capacityRemaining = Math.max(0, monthlyLimit - usedRequests);
  const capacityPercent = Math.round((capacityRemaining / monthlyLimit) * 100);

  const tokensRemaining = tokens?.tokens_remaining ?? 2;
  const tokensGranted = tokens?.tokens_granted ?? 5;
  const tokensPercent = Math.round((tokensRemaining / tokensGranted) * 100);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (isAlum) {
      router.push(`/opportunities?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/student/matches?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="app">
      {/* Persistent Left Sidebar */}
      <aside className={mobileOpen ? "open" : ""}>
        <div className="px-5 pt-5 pb-3 border-b border-[var(--line-soft)] flex items-center justify-between">
          <Link href="/" className="inline-flex items-center group">
            <BrandLogo size="md" withText badge={isAlum ? "Alumni" : "Student"} />
          </Link>
          <button
            className="md:hidden p-1 text-gray-500 hover:text-gray-700"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="side-head">
          <div className="role-label">
            <span className="avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
              {initial}
            </span>
            <span>
              <b>{displayName}</b>
              <small className={isAlum ? "text-[#3563ff] font-medium" : "text-[#66758e] font-medium"}>
                {isAlum
                  ? `${tier.label} · Alumni`
                  : profile?.study_year
                  ? `${getStudyYearLabel(profile.study_year)} Student`
                  : "Student account"}
              </small>
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={item.isActive ? "active" : ""}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.count !== undefined && <i>{item.count}</i>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Capacity / Token Card */}
        <div className="side-goal">
          {isAlum ? (
            <>
              <span>
                <Briefcase className="h-3.5 w-3.5 text-[#3563ff]" /> Monthly capacity
              </span>
              <b>
                {capacityRemaining} <small>of {monthlyLimit} left</small>
              </b>
              <div>
                <i style={{ width: `${capacityPercent}%` }} />
              </div>
              <button onClick={handleSignOut}>
                <span>Sign out</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <span>
                <Info className="h-3.5 w-3.5 text-[#3563ff]" /> Monthly tokens
              </span>
              <b>
                {tokensRemaining} <small>of {tokensGranted} left</small>
              </b>
              <div>
                <i style={{ width: `${tokensPercent}%` }} />
              </div>
              <button onClick={handleSignOut}>
                <span>Sign out</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Search Bar & Actions */}
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>

          <form onSubmit={handleSearchSubmit} className="global-search">
            <Search className="h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mentors, goals, opportunities..."
            />
          </form>

          <div className="top-actions">
            {isAlum ? (
              <div className="flex items-center gap-1.5">
                <span className="badge soft text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#3563ff]" />
                  <span>{tier.label}</span>
                </span>
                <span className="badge success text-xs font-semibold">Alumni</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {profile?.study_year ? (
                  <span className="badge soft text-xs font-semibold text-[#3563ff]">
                    {getStudyYearLabel(profile.study_year)}
                  </span>
                ) : null}
                <span className="badge soft text-xs font-semibold">Student</span>
              </div>
            )}

            <button
              className="icon-btn"
              onClick={() => router.push("/opportunities")}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-gray-600" />
              <i />
            </button>

            <Link href="/profile" className="profile-btn">
              <span className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                {initial}
              </span>
              <span>{displayName}</span>
            </Link>
          </div>
        </header>

        {/* Page Inner Content */}
        <main className="content">{children}</main>
      </div>

      {/* Mobile Scrim / Backdrop */}
      {mobileOpen && (
        <button
          className="scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}
    </div>
  );
}
