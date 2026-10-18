import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: goalId } = await params;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: goal, error } = await supabase
        .from("goals")
        .select(`
          *,
          student:profiles!goals_student_id_fkey(*),
          alumnus:profiles!goals_alum_id_fkey(*),
          request:connection_requests(*)
        `)
        .eq("id", goalId)
        .single();

      if (error || !goal) {
        return NextResponse.json({ error: "Goal not found" }, { status: 404 });
      }

      // Check access permission: user must be student or alumnus
      if (goal.student_id !== user.id && goal.alum_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Fetch updates
      const { data: updates } = await supabase
        .from("goal_updates")
        .select(`*, author:profiles(*)`)
        .eq("goal_id", goalId)
        .order("created_at", { ascending: true });

      // Fetch feedback if any
      const { data: feedback } = await supabase
        .from("feedback")
        .select("*")
        .eq("goal_id", goalId);

      return NextResponse.json({
        goal,
        updates: updates || [],
        feedback: feedback || [],
      });
    } catch (err) {
      console.warn("Supabase goal query failed, using local store:", err);
    }
  }

  // Standalone fallback
  const goal = localStore.goals.find((g) => g.id === goalId) || localStore.goals[0];
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const enriched = {
    ...goal,
    student: localStore.profiles.find((p) => p.id === goal.student_id),
    alumnus: localStore.profiles.find((p) => p.id === goal.alum_id),
    request: localStore.requests.find((r) => r.id === goal.request_id),
  };

  return NextResponse.json({
    goal: enriched,
    updates: [
      {
        id: "update-1",
        goal_id: goal.id,
        author_id: goal.alum_id,
        author: enriched.alumnus,
        content: "Shared APM mock interview prep framework and evaluation rubric.",
        created_at: "2026-10-12T15:00:00Z",
      },
      {
        id: "update-2",
        goal_id: goal.id,
        author_id: goal.student_id,
        author: enriched.student,
        content: "Completed 45-min mock interview session. Reviewed feedback on product sense and trade-offs.",
        created_at: "2026-10-14T16:00:00Z",
      },
    ],
    feedback: localStore.feedback.filter((f) => f.goal_id === goal.id),
    isDemo: true,
  });
}
