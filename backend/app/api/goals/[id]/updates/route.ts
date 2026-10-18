import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  content: z.string().min(5, "Update must be at least 5 characters").max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: goalId } = await params;
    const body = await req.json();
    const { content } = updateSchema.parse(body);

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check user is participant
      const { data: goal } = await supabase
        .from("goals")
        .select("student_id, alum_id")
        .eq("id", goalId)
        .single();

      if (!goal || (goal.student_id !== user.id && goal.alum_id !== user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data: newUpdate, error } = await supabase
        .from("goal_updates")
        .insert({
          goal_id: goalId,
          author_id: user.id,
          content,
        })
        .select(`*, author:profiles(*)`)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ update: newUpdate }, { status: 201 });
    }

    // Standalone fallback
    return NextResponse.json(
      {
        update: {
          id: crypto.randomUUID(),
          goal_id: goalId,
          content,
          created_at: new Date().toISOString(),
        },
        isDemo: true,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const msg = err.issues?.[0]?.message || (err as any).errors?.[0]?.message || "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
