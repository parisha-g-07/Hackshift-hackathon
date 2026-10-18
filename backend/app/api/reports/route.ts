import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const reportSchema = z.object({
  target_user_id: z.string().regex(uuidPattern, "Invalid target user identifier").optional().nullable(),
  target_type: z.enum(["profile", "intent", "offer", "message", "goal"]),
  target_id: z.string().regex(uuidPattern, "Invalid target identifier").optional().nullable(),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(200),
  details: z.string().max(1000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = reportSchema.parse(body);

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: report, error } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          target_user_id: validated.target_user_id || null,
          target_type: validated.target_type,
          target_id: validated.target_id || null,
          reason: validated.reason,
          details: validated.details || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, reportId: report.id }, { status: 201 });
    }

    // Standalone fallback: mock recording private admin review record
    const reportId = crypto.randomUUID();
    return NextResponse.json({
      success: true,
      reportId,
      notice: "Report filed successfully and queued for confidential administrator review.",
      isDemo: true,
    }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const msg = err.issues?.[0]?.message || (err as any).errors?.[0]?.message || "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
