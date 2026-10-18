import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/store";

export const dynamic = "force-dynamic";

const updateCapacitySchema = z.object({
  monthly_limit: z.number().int().min(1, "Limit must be at least 1").max(20, "Limit cannot exceed 20"),
});

export async function GET() {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: capacity } = await supabase
        .from("alumni_capacity_monthly")
        .select("*")
        .eq("user_id", user.id)
        .eq("period_start", currentMonth)
        .maybeSingle();

      const limit = capacity?.monthly_limit ?? 3;
      const reserved = capacity?.reserved_count ?? 0;
      const processed = capacity?.processed_count ?? 0;

      return NextResponse.json({
        period_start: currentMonth,
        monthly_limit: limit,
        reserved_count: reserved,
        processed_count: processed,
        remaining_capacity: Math.max(0, limit - (reserved + processed)),
      });
    } catch (err) {
      console.warn("Supabase capacity query failed, fallback:", err);
    }
  }

  // Standalone fallback
  const alum = localStore.profiles[0]; // Priya
  const cap = localStore.capacities[alum.id] || {
    monthly_limit: 4,
    reserved_count: 1,
    processed_count: 1,
    remaining_capacity: 2,
    period_start: "2026-10-01",
  };

  return NextResponse.json({ ...cap, isDemo: true });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { monthly_limit } = updateCapacitySchema.parse(body);
    const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: updated, error } = await supabase
        .from("alumni_capacity_monthly")
        .upsert(
          {
            user_id: user.id,
            period_start: currentMonth,
            monthly_limit,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,period_start" }
        )
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        capacity: {
          ...updated,
          remaining_capacity: Math.max(0, updated.monthly_limit - (updated.reserved_count + updated.processed_count)),
        },
      });
    }

    // Standalone fallback
    const alum = localStore.profiles[0];
    const cap = localStore.capacities[alum.id];
    if (cap) {
      cap.monthly_limit = monthly_limit;
      cap.remaining_capacity = Math.max(0, monthly_limit - (cap.reserved_count + cap.processed_count));
    }

    return NextResponse.json({ capacity: cap, isDemo: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const msg = err.issues?.[0]?.message || (err as any).errors?.[0]?.message || "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
