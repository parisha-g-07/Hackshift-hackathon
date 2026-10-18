import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Supabase OAuth & Auth Callback Handler
 * Securely exchanges authorization code for user session.
 * Handles OAuth provider errors (e.g. user cancelled consent).
 * Enforces exactly one profile per auth.users.id and redirects incomplete profiles to onboarding.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/";

  // 1. Handle OAuth cancellation or provider error
  if (error) {
    const errorMsg = errorDescription || error;
    const redirectUrl = new URL("/auth/sign-in", requestUrl.origin);
    redirectUrl.searchParams.set("error", errorMsg);
    if (error === "access_denied") {
      redirectUrl.searchParams.set("cancelled", "true");
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Exchange authorization code for session
  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("OAuth code exchange failed:", exchangeError.message);
        const redirectUrl = new URL("/auth/sign-in", requestUrl.origin);
        redirectUrl.searchParams.set("error", "Failed to complete authentication: " + exchangeError.message);
        return NextResponse.redirect(redirectUrl);
      }

      const user = sessionData?.user;
      if (!user) {
        return NextResponse.redirect(new URL("/auth/sign-in", requestUrl.origin));
      }

      // 3. Ensure profile row exists (1 profile per auth.users.id)
      let { data: profile } = await supabase
        .from("profiles")
        .select("id, role, full_name, institution, study_year, graduation_year, is_active")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        const meta = user.user_metadata || {};
        const fallbackRole = meta.role === "alum" || next?.includes("alumni") ? "alum" : "student";
        const fallbackName =
          meta.full_name || meta.name || (user.email ? user.email.split("@")[0] : "SyncTies Member");
        const fallbackAvatar = meta.avatar_url || meta.picture || null;

        const { data: newProfile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email,
              full_name: fallbackName,
              avatar_url: fallbackAvatar,
              role: fallbackRole,
              institution: meta.institution || "University Pilot",
              verification_status: "unverified",
              is_active: true,
              last_active_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          )
          .select()
          .single();

        profile = newProfile;
      }

      // 4. Check if profile is incomplete (requires onboarding)
      const isStudentIncomplete =
        profile?.role === "student" && (!profile.study_year || profile.institution === "University Pilot");
      const isAlumIncomplete =
        profile?.role === "alum" && (!profile.graduation_year || profile.institution === "University Pilot");

      if (!profile || isStudentIncomplete || isAlumIncomplete) {
        const onboardingUrl = new URL("/onboarding", requestUrl.origin);
        onboardingUrl.searchParams.set("role", profile?.role || "student");
        if (profile?.full_name) {
          onboardingUrl.searchParams.set("name", profile.full_name);
        }
        return NextResponse.redirect(onboardingUrl);
      }

      // 5. Navigate to destination or role-based dashboard
      if (next && next !== "/" && next.startsWith("/")) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }

      if (profile.role === "alum") {
        return NextResponse.redirect(new URL("/alumni/dashboard", requestUrl.origin));
      }

      return NextResponse.redirect(new URL("/student/dashboard", requestUrl.origin));
    } catch (err: any) {
      console.error("Auth callback exception:", err);
      const redirectUrl = new URL("/auth/sign-in", requestUrl.origin);
      redirectUrl.searchParams.set("error", "Authentication error: " + (err?.message || "Unknown error"));
      return NextResponse.redirect(redirectUrl);
    }
  }

  // No code or error provided: return to sign in
  return NextResponse.redirect(new URL("/auth/sign-in", requestUrl.origin));
}
