import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Query student monthly tokens
      const { data: summary } = await supabase
        .from("student_monthly_tokens")
        .select("*")
        .eq("user_id", user.id)
        .eq("period_start", currentMonth)
        .maybeSingle();

      const { data: ledger } = await supabase
        .from("token_ledger")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const granted = summary?.tokens_granted ?? 5;
      const spent = summary?.tokens_spent ?? 0;

      return NextResponse.json({
        period_start: currentMonth,
        tokens_granted: granted,
        tokens_spent: spent,
        tokens_remaining: Math.max(0, granted - spent),
        ledger: ledger || [],
      });
    } catch (err) {
      console.warn("Supabase token balance query failed, using local store:", err);
    }
  }

  // Standalone fallback
  const student = localStore.profiles[3];
  const summary = localStore.studentTokens[student.id] || {
    tokens_granted: 5,
    tokens_spent: 1,
    tokens_remaining: 4,
    period_start: "2026-10-01",
  };

  return NextResponse.json({
    ...summary,
    ledger: [
      {
        id: "ledger-1",
        user_id: student.id,
        period_start: "2026-10-01",
        entry_type: "grant",
        amount: 5,
        reason: "Monthly token allowance (October 2026)",
        created_at: "2026-10-01T00:00:00Z",
      },
      {
        id: "ledger-2",
        user_id: student.id,
        period_start: "2026-10-01",
        entry_type: "spend",
        amount: -1,
        reason: "Connection request to Priya Sharma",
        created_at: "2026-10-10T12:00:00Z",
      },
    ],
    isDemo: true,
  });
}
