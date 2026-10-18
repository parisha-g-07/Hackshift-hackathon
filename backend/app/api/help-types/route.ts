import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore, CANONICAL_HELP_TYPES } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("help_types")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ helpTypes: data });
      }
    } catch (err) {
      console.warn("Supabase help_types query error, fallback to local store:", err);
    }
  }

  return NextResponse.json({ helpTypes: localStore.helpTypes });
}
