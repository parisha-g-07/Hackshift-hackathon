import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/store";
import { canSubmitFeedback } from "@/lib/goals/lifecycle";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const feedbackSchema = z.object({
  goal_id: z.string().regex(uuidPattern, "Invalid goal identifier"),
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5),
  comments: z.string().max(1000).optional().nullable(),
  referral_status: z
    .enum(["none", "offered", "submitted", "interview", "hired", "unsuccessful"])
    .default("none"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = feedbackSchema.parse(body);

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // 1. Verify goal exists and is fulfilled
      const { data: goal, error: goalError } = await supabase
        .from("goals")
        .select("student_id, alum_id, status")
        .eq("id", validated.goal_id)
        .single();

      if (goalError || !goal) {
        return NextResponse.json({ error: "Goal not found" }, { status: 404 });
      }

      if (!canSubmitFeedback(goal.status as any)) {
        return NextResponse.json(
          { error: "Feedback can only be submitted after mutual goal fulfillment" },
          { status: 400 }
        );
      }

      // Determine reviewer and reviewee
      const isStudent = goal.student_id === user.id;
      const isAlum = goal.alum_id === user.id;

      if (!isStudent && !isAlum) {
        return NextResponse.json({ error: "Forbidden: Not a goal participant" }, { status: 403 });
      }

      const revieweeId = isStudent ? goal.alum_id : goal.student_id;

      // 2. Prevent duplicate feedback
      const { data: existing } = await supabase
        .from("feedback")
        .select("id")
        .eq("goal_id", validated.goal_id)
        .eq("reviewer_id", user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "You have already submitted feedback for this goal" },
          { status: 400 }
        );
      }

      // 3. Insert feedback
      const { data: feedback, error: insertError } = await supabase
        .from("feedback")
        .insert({
          goal_id: validated.goal_id,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating: validated.rating,
          comments: validated.comments || null,
          referral_status: validated.referral_status,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ feedback }, { status: 201 });
    }

    // Standalone fallback
    const student = localStore.profiles[3];
    const newFeedback = {
      id: crypto.randomUUID(),
      goal_id: validated.goal_id,
      reviewer_id: student.id,
      reviewee_id: localStore.profiles[0].id,
      rating: validated.rating,
      comments: validated.comments || undefined,
      referral_status: validated.referral_status,
      is_flagged: false,
      created_at: new Date().toISOString(),
    };

    localStore.feedback.push(newFeedback);

    return NextResponse.json({ feedback: newFeedback, isDemo: true }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const msg = err.issues?.[0]?.message || (err as any).errors?.[0]?.message || "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
