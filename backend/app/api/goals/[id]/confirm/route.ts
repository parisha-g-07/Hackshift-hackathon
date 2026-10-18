import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/store";
import { shouldFulfillGoal } from "@/lib/goals/lifecycle";

export const dynamic = "force-dynamic";

export async function POST(
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

      // Execute atomic confirmation RPC
      const { data: result, error: rpcError } = await supabase.rpc(
        "confirm_goal_completion",
        {
          p_goal_id: goalId,
          p_user_id: user.id,
        }
      );

      if (rpcError) {
        return NextResponse.json({ error: rpcError.message }, { status: 400 });
      }

      return NextResponse.json(result);
    } catch (err) {
      console.warn("Supabase confirm RPC failed, fallback:", err);
    }
  }

  // Standalone fallback
  const goal = localStore.goals.find((g) => g.id === goalId) || localStore.goals[0];
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  // Simulate confirmation
  if (!goal.student_confirmed_at) {
    goal.student_confirmed_at = new Date().toISOString();
  } else if (!goal.alum_confirmed_at) {
    goal.alum_confirmed_at = new Date().toISOString();
  }

  if (shouldFulfillGoal(goal.student_confirmed_at, goal.alum_confirmed_at)) {
    goal.status = "fulfilled";
    goal.fulfilled_at = new Date().toISOString();
  }

  return NextResponse.json({
    success: true,
    status: goal.status,
    student_confirmed: Boolean(goal.student_confirmed_at),
    alum_confirmed: Boolean(goal.alum_confirmed_at),
    is_fulfilled: goal.status === "fulfilled",
    isDemo: true,
  });
}
