import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore, CANONICAL_DOMAINS } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("domains")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ domains: data });
      }
    } catch (err) {
      console.warn("Supabase domains query error, fallback to local store:", err);
    }
  }

  return NextResponse.json({ domains: localStore.domains });
}
