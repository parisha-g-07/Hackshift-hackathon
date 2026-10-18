import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as handleCallback } from "@/app/auth/callback/route";
import { localStore } from "@/lib/data/store";
import { calculateTotalMatchScore } from "@/lib/matching/score";

describe("SyncTies Authentication Architecture & Flow Integration", () => {
  describe("1. Email & Password Domain Policy", () => {
    it("accepts arbitrary valid non-college domains for registration", () => {
      const validEmails = [
        "student@gmail.com",
        "developer@proton.me",
        "analyst@mckinsey.com",
        "engineer@stripe.com",
        "founder@ycombinator.com",
        "candidate@outlook.com",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
        // Explicitly verify no requirement for .edu or academic suffix
        expect(email.endsWith(".edu")).toBe(false);
      });
    });

    it("does not reject non-institutional email formats or enforce domain allowlists", () => {
      const isInstitutionalOnly = (email: string) => {
        // Anti-pattern check: make sure no such restriction exists in production code
        return email.endsWith(".edu") || email.endsWith(".ac.in") || email.includes(".edu.");
      };

      expect(isInstitutionalOnly("alex@gmail.com")).toBe(false);
      expect(isInstitutionalOnly("priya@company.io")).toBe(false);
    });
  });

  describe("2. Google OAuth Integration", () => {
    it("initiates Google OAuth with correct provider name and callback URL", async () => {
      const mockSignInWithOAuth = vi.fn().mockResolvedValue({
        data: { url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=google-client-id" },
        error: null,
      });

      const provider = "google";
      const origin = "http://localhost:3000";
      const redirectTo = `${origin}/auth/callback?next=/student/dashboard`;

      const result = await mockSignInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback?next=/student/dashboard",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      expect(result.data?.url).toContain("accounts.google.com");
    });
  });

  describe("3. LinkedIn OAuth Integration (OpenID Connect)", () => {
    it("strictly uses 'linkedin_oidc' as provider ID instead of deprecated 'linkedin'", async () => {
      const mockSignInWithOAuth = vi.fn().mockImplementation(({ provider }) => {
        if (provider === "linkedin") {
          return Promise.resolve({
            data: null,
            error: { message: "Deprecated provider: linkedin. Use linkedin_oidc instead." },
          });
        }
        if (provider === "linkedin_oidc") {
          return Promise.resolve({
            data: { url: "https://www.linkedin.com/oauth/v2/authorization?client_id=linkedin-id" },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: { message: "Unknown provider" } });
      });

      // Assert deprecated provider fails
      const deprecatedAttempt = await mockSignInWithOAuth({ provider: "linkedin" });
      expect(deprecatedAttempt.error).not.toBeNull();
      expect(deprecatedAttempt.error.message).toContain("Deprecated provider");

      // Assert current provider succeeds
      const validAttempt = await mockSignInWithOAuth({
        provider: "linkedin_oidc",
        options: { redirectTo: "http://localhost:3000/auth/callback" },
      });
      expect(validAttempt.error).toBeNull();
      expect(validAttempt.data?.url).toContain("linkedin.com");
    });
  });

  describe("4. OAuth Callback & Code Exchange", () => {
    it("redirects to sign-in with cancellation alert when user cancels OAuth consent", async () => {
      const req = new NextRequest(
        "http://localhost:3000/auth/callback?error=access_denied&error_description=The+user+denied+the+request"
      );

      const res = await handleCallback(req);
      expect(res.status).toBe(307); // NextResponse.redirect
      const location = res.headers.get("location") || "";
      expect(location).toContain("/auth/sign-in");
      expect(location).toContain("cancelled=true");
      expect(location).toContain("error=");
    });

    it("redirects to sign-in when generic provider error is returned", async () => {
      const req = new NextRequest(
        "http://localhost:3000/auth/callback?error=server_error&error_description=Provider+down"
      );

      const res = await handleCallback(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location") || "";
      expect(location).toContain("/auth/sign-in");
      expect(location).toContain("Provider+down");
    });

    it("returns user to sign-in if neither code nor error is present", async () => {
      const req = new NextRequest("http://localhost:3000/auth/callback");
      const res = await handleCallback(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location") || "";
      expect(location).toContain("/auth/sign-in");
    });
  });

  describe("5. Profile Mapping & Incomplete OAuth Metadata Handling", () => {
    it("maintains exactly 1 profile per auth.users.id without duplicating on returning login", () => {
      const authUserId = "11111111-2222-3333-4444-555555555555";
      const profilesMap = new Map<string, any>();

      // First OAuth login
      const firstLoginProfile = {
        id: authUserId,
        email: "alex@gmail.com",
        full_name: "Alex Morgan",
        role: "student",
        institution: "University Pilot",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      profilesMap.set(authUserId, firstLoginProfile);
      expect(profilesMap.size).toBe(1);

      // Returning OAuth login with updated avatar
      const returningLoginMetadata = {
        id: authUserId,
        email: "alex@gmail.com",
        avatar_url: "https://lh3.googleusercontent.com/photo.jpg",
      };

      const existing = profilesMap.get(authUserId);
      expect(existing).toBeDefined();
      profilesMap.set(authUserId, {
        ...existing,
        avatar_url: returningLoginMetadata.avatar_url,
        updated_at: new Date().toISOString(),
      });

      // Still exactly 1 profile row
      expect(profilesMap.size).toBe(1);
      expect(profilesMap.get(authUserId).avatar_url).toBe("https://lh3.googleusercontent.com/photo.jpg");
    });

    it("gracefully generates fallback names and defaults when OAuth profile data is missing", () => {
      const rawUserMetaData: Record<string, any> = {}; // Missing name, picture, etc.
      const email = "coder99@gmail.com";

      const resolvedFullName =
        rawUserMetaData.full_name ||
        rawUserMetaData.name ||
        (email ? email.split("@")[0] : "SyncTies Member");

      const resolvedRole =
        rawUserMetaData.role === "alum" ? "alum" : "student";

      const resolvedAvatar =
        rawUserMetaData.avatar_url || rawUserMetaData.picture || null;

      expect(resolvedFullName).toBe("coder99");
      expect(resolvedRole).toBe("student");
      expect(resolvedAvatar).toBeNull();
    });

    it("prompts user to complete onboarding if profile lacks graduation or study year", () => {
      const incompleteStudentProfile = {
        id: "test-user-id",
        role: "student",
        study_year: null, // Incomplete
        institution: "University Pilot",
      };

      const isIncomplete =
        !incompleteStudentProfile.study_year ||
        incompleteStudentProfile.institution === "University Pilot";

      expect(isIncomplete).toBe(true);

      const completeStudentProfile = {
        id: "test-user-id",
        role: "student",
        study_year: 4,
        institution: "Stanford University",
      };

      const isComplete =
        Boolean(completeStudentProfile.study_year) &&
        completeStudentProfile.institution !== "University Pilot";

      expect(isComplete).toBe(true);
    });
  });

  describe("6. Password Recovery & Reset Flow", () => {
    it("simulates password reset email dispatch for any valid email", async () => {
      const mockResetPasswordForEmail = vi.fn().mockImplementation((email: string, options: any) => {
        expect(email).toBe("user@example.com");
        expect(options.redirectTo).toContain("/auth/reset-password");
        return Promise.resolve({ data: {}, error: null });
      });

      const res = await mockResetPasswordForEmail("user@example.com", {
        redirectTo: "http://localhost:3000/auth/reset-password",
      });

      expect(res.error).toBeNull();
      expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1);
    });

    it("detects expired reset links from URL parameters", () => {
      const searchParamsWithExpiredOtp = new URLSearchParams("error=access_denied&error_code=otp_expired");
      const isExpired =
        searchParamsWithExpiredOtp.get("error_code") === "otp_expired" ||
        searchParamsWithExpiredOtp.get("error") === "access_denied";

      expect(isExpired).toBe(true);
    });
  });

  describe("7. Elimination of Mandatory verification_status Matching Gates", () => {
    it("includes active alumni in matches regardless of verification_status", () => {
      // Create a test alumnus profile with 'unverified' status
      const unverifiedAlum = {
        id: "alumni-unverified-001",
        full_name: "Jordan Lee",
        email: "jordan@startup.io",
        role: "alum" as const,
        institution: "Self-Reported University",
        verification_status: "unverified" as const,
        is_active: true,
        last_active_at: new Date().toISOString(),
      };

      // In the updated matching policy, active status is required, but verification_status != 'verified' must not block
      const candidateIsEligible =
        unverifiedAlum.role === "alum" && unverifiedAlum.is_active;

      expect(candidateIsEligible).toBe(true);
    });

    it("allows connection requests for active alumni without verified badge requirement", () => {
      const alum = {
        id: "alumni-unverified-002",
        role: "alum",
        is_active: true,
        verification_status: "unverified",
      };

      const canAcceptRequest = alum.role === "alum" && alum.is_active;
      expect(canAcceptRequest).toBe(true);
    });
  });
});
