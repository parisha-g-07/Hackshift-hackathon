import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: notifications, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ notifications: notifications || [] });
    } catch (err) {
      console.warn("Supabase notifications error, fallback:", err);
    }
  }

  // Standalone fallback
  return NextResponse.json({
    notifications: [
      {
        id: "notif-1",
        user_id: "demo-user",
        type: "request_accepted",
        title: "Connection Request Accepted",
        body: "Priya Sharma accepted your mock interview request.",
        link: "/goals/77777777-7777-7777-7777-777777777701",
        read_at: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ],
    isDemo: true,
  });
}
