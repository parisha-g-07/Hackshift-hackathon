import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/store";
import { Intent } from "@/types/database";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const createIntentSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(15, "Description must be at least 15 characters").max(2000),
  help_type_id: z.string().regex(uuidPattern, "Invalid help type identifier"),
  target_role: z.string().max(100).optional(),
  target_company: z.string().max(100).optional(),
  domain_ids: z.array(z.string().regex(uuidPattern, "Invalid domain identifier")).min(1, "Select at least 1 domain"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      let query = supabase
        .from("intents")
        .select(`
          *,
          help_type:help_types(*),
          domains:intent_domains(domain:domains(*))
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Transform joined domains
      const formatted = (data || []).map((i: any) => ({
        ...i,
        domains: i.domains?.map((d: any) => d.domain) || [],
      }));

      return NextResponse.json({ intents: formatted });
    } catch (err) {
      console.warn("Supabase intents query failed, fallback:", err);
    }
  }

  // Local store fallback
  let intents = localStore.intents;
  if (statusFilter) {
    intents = intents.filter((i) => i.status === statusFilter);
  }

  const enriched = intents.map((i) => ({
    ...i,
    domains: localStore.domains.filter((d) => (i.domain_ids || []).includes(d.id)),
    help_type: localStore.helpTypes.find((ht) => ht.id === i.help_type_id),
  }));

  return NextResponse.json({ intents: enriched });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createIntentSchema.parse(body);

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check role is student
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "student") {
        return NextResponse.json(
          { error: "Only students can create intents" },
          { status: 403 }
        );
      }

      // Create intent
      const { data: newIntent, error: insertError } = await supabase
        .from("intents")
        .insert({
          user_id: user.id,
          title: validated.title,
          description: validated.description,
          help_type_id: validated.help_type_id,
          target_role: validated.target_role || null,
          target_company: validated.target_company || null,
          status: "open",
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Insert intent domains
      const domainRows = validated.domain_ids.map((domain_id) => ({
        intent_id: newIntent.id,
        domain_id,
      }));

      await supabase.from("intent_domains").insert(domainRows);

      return NextResponse.json({ intent: newIntent }, { status: 201 });
    }

    // Local Store fallback
    const studentUser = localStore.profiles[3];
    const newIntent: Intent & { domain_ids: string[] } = {
      id: crypto.randomUUID(),
      user_id: studentUser.id,
      title: validated.title,
      description: validated.description,
      help_type_id: validated.help_type_id,
      status: "open",
      target_role: validated.target_role,
      target_company: validated.target_company,
      domain_ids: validated.domain_ids,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStore.intents.unshift(newIntent);

    return NextResponse.json(
      {
        intent: {
          ...newIntent,
          domains: localStore.domains.filter((d) => validated.domain_ids.includes(d.id)),
          help_type: localStore.helpTypes.find((h) => h.id === validated.help_type_id),
        },
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
