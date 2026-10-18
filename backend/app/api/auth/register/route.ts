import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { calculateStudyYear } from "@/lib/students/study-year";

export const dynamic = "force-dynamic";

/**
 * Registration API Route
 * Provisions new users directly with confirmed email via Supabase Admin SDK,
 * completely bypassing external SMTP provider rate limits on the free tier.
 * Ensures the profile trigger runs and initializes the user's role, study_year, and profile.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      fullName,
      role = "student",
      expectedGraduationYear,
      expectedGraduationMonth,
      graduationYear,
    } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const assignedRole = role === "alum" ? "alum" : "student";
    const cleanName = fullName?.trim() || email.split("@")[0] || "SyncTies Member";

    // Auto-calculate study_year (1st, 2nd, 3rd, 4th year) for students
    let computedStudyYear: number | null = null;
    const gradYearNum = expectedGraduationYear ? Number(expectedGraduationYear) : null;
    const gradMonthNum = expectedGraduationMonth ? Number(expectedGraduationMonth) : 5; // Default May
    if (assignedRole === "student" && gradYearNum) {
      computedStudyYear = calculateStudyYear(gradMonthNum, gradYearNum).studyYear;
    }

    const admin = createAdminClient();

    // 1. Attempt to create the user with pre-confirmed email
    const { data, error: createError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        role: assignedRole,
        study_year: computedStudyYear,
        expected_graduation_year: gradYearNum,
        expected_graduation_month: gradMonthNum,
      },
    });

    if (createError) {
      const errMsg = createError.message.toLowerCase();

      // If user is already registered in Supabase
      if (errMsg.includes("already registered") || errMsg.includes("already exists") || errMsg.includes("duplicate")) {
        // Check if user exists in auth list
        const { data: listData } = await admin.auth.admin.listUsers();
        const existing = listData?.users?.find(
          (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
        );

        if (existing) {
          // If unconfirmed or stranded from previous rate limit, activate and set their password
          if (!existing.email_confirmed_at) {
            await admin.auth.admin.updateUserById(existing.id, {
              password,
              email_confirm: true,
              user_metadata: {
                full_name: cleanName,
                role: assignedRole,
              },
            });

            // Ensure profile exists
            await admin.from("profiles").upsert(
              {
                id: existing.id,
                email: existing.email,
                full_name: cleanName,
                role: assignedRole,
                institution: "University Pilot",
                verification_status: "unverified",
                is_active: true,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );

            return NextResponse.json({
              success: true,
              message: "Account verified and password updated.",
              user: { id: existing.id, email: existing.email },
            });
          }

          return NextResponse.json(
            { error: "An account with this email address already exists. Please sign in instead." },
            { status: 409 }
          );
        }
      }

      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const user = data?.user;
    if (!user) {
      return NextResponse.json({ error: "Failed to create user account." }, { status: 500 });
    }

    // 2. Ensure profile exists (defensive fallback for trigger)
    try {
      await admin.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          full_name: cleanName,
          role: assignedRole,
          institution: "University Pilot",
          study_year: computedStudyYear,
          expected_graduation_year: gradYearNum,
          graduation_year: assignedRole === "alum" && graduationYear ? Number(graduationYear) : null,
          verification_status: "unverified",
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (profileErr) {
      console.warn("Defensive profile upsert notice:", profileErr);
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
