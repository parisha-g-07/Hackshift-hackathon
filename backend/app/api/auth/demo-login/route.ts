import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const DEMO_PASSWORD = "PilotPassword2026!";

const DEMO_ACCOUNTS = {
  google: {
    email: "alex.google.student@gmail.com",
    fullName: "Alex Chen",
    role: "student" as const,
    institution: "Delhi Technological University",
    studyYear: 4,
    provider: "google",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  },
  linkedin: {
    email: "sarah.linkedin.alum@syncties.com",
    fullName: "Sarah Jenkins",
    role: "alum" as const,
    institution: "Delhi Technological University",
    company: "Stripe",
    jobTitle: "Staff Software Engineer",
    industry: "Fintech & Payments",
    graduationYear: 2023,
    provider: "linkedin_oidc",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
  student: {
    email: "nikki.artistics@gmail.com",
    fullName: "Nikki Kumar",
    role: "student" as const,
    institution: "Delhi Technological University",
    studyYear: 3,
    provider: "email",
    avatarUrl: null,
  },
  alum: {
    email: "timetable.scheduler.dtu@gmail.com",
    fullName: "HR Alumnus",
    role: "alum" as const,
    institution: "Delhi Technological University",
    company: "Google",
    jobTitle: "Senior Product Manager",
    industry: "Big Tech",
    graduationYear: 2024,
    provider: "email",
    avatarUrl: null,
  },
};

/**
 * Pilot & Development Demo Login API
 * Provisions real Supabase auth users and profiles with verified credentials
 * so developers, evaluators, and testers can instantly log in with Google,
 * LinkedIn, Student, or Alumnus identities without needing external OAuth console setups.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = (body.type || "student") as keyof typeof DEMO_ACCOUNTS;
    const config = DEMO_ACCOUNTS[type] || DEMO_ACCOUNTS.student;

    const email = (body.email && typeof body.email === "string" && body.email.includes("@"))
      ? body.email.trim().toLowerCase()
      : config.email;

    // In unit test or offline mode without live Supabase
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        email,
        password: DEMO_PASSWORD,
        role: config.role,
        fullName: config.fullName,
        provider: config.provider,
      });
    }

    const admin = createAdminClient();

    // 1. Locate or create the auth user
    const { data: listData } = await admin.auth.admin.listUsers();
    const existing = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (!existing) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: config.fullName,
          role: config.role,
          provider: config.provider,
          avatar_url: config.avatarUrl,
        },
      });

      if (createErr || !created?.user) {
        return NextResponse.json(
          { error: createErr?.message || "Failed to create demo user" },
          { status: 500 }
        );
      }
      userId = created.user.id;
    } else {
      userId = existing.id;
      // Ensure password and confirmation
      await admin.auth.admin.updateUserById(userId, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          ...existing.user_metadata,
          full_name: existing.user_metadata?.full_name || config.fullName,
          role: existing.user_metadata?.role || config.role,
          provider: config.provider,
          avatar_url: existing.user_metadata?.avatar_url || config.avatarUrl,
        },
      });
    }

    // 2. Ensure profile exists and is verified in public.profiles
    const profilePayload: Record<string, unknown> = {
      id: userId,
      email,
      full_name: config.fullName,
      role: config.role,
      institution: config.institution,
      verification_status: "verified",
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (config.role === "student") {
      profilePayload.study_year = config.studyYear || 3;
    } else {
      profilePayload.company = (config as any).company || "Technology Partner";
      profilePayload.job_title = (config as any).jobTitle || "Mentor";
      profilePayload.industry = (config as any).industry || "Software Engineering";
      profilePayload.graduation_year = (config as any).graduationYear || 2024;
    }

    if (config.avatarUrl) {
      profilePayload.avatar_url = config.avatarUrl;
    }

    await admin.from("profiles").upsert(profilePayload, { onConflict: "id" });

    // 3. For alumni, ensure they have at least one active offer for instant matching demo
    if (config.role === "alum") {
      const { data: existingOffers } = await admin
        .from("offers")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (!existingOffers || existingOffers.length === 0) {
        // Fetch help type & domain
        const { data: helpTypes } = await admin.from("help_types").select("id").limit(1);
        const { data: domains } = await admin.from("domains").select("id").limit(2);

        if (helpTypes?.[0] && domains?.length) {
          const { data: newOffer } = await admin
            .from("offers")
            .insert({
              user_id: userId,
              title: "Career Guidance & Technical Mentorship",
              description: "Open to system design reviews, interview preparation, and capstone guidance for juniors.",
              help_type_id: helpTypes[0].id,
              status: "active",
            })
            .select()
            .single();

          if (newOffer) {
            await admin.from("offer_domains").insert(
              domains.map((d) => ({
                offer_id: newOffer.id,
                domain_id: d.id,
              }))
            );
          }
        }
      }
    }

    // 4. Return credentials for seamless client authentication
    return NextResponse.json({
      success: true,
      email,
      password: DEMO_PASSWORD,
      role: config.role,
      fullName: config.fullName,
      provider: config.provider,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
