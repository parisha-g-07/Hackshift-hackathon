import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/store";
import { Offer } from "@/types/database";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const createOfferSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(15, "Description must be at least 15 characters").max(2000),
  help_type_id: z.string().regex(uuidPattern, "Invalid help type identifier"),
  status: z.enum(["active", "paused", "closed", "draft"]).default("active"),
  opportunity_available: z.boolean().default(false),
  opportunity_title: z.string().max(100).optional().nullable(),
  opportunity_company: z.string().max(100).optional().nullable(),
  opportunity_link: z.string().url().optional().nullable().or(z.literal("")),
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
        .from("offers")
        .select(`
          *,
          help_type:help_types(*),
          domains:offer_domains(domain:domains(*))
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const formatted = (data || []).map((o: any) => ({
        ...o,
        domains: o.domains?.map((d: any) => d.domain) || [],
      }));

      return NextResponse.json({ offers: formatted });
    } catch (err) {
      console.warn("Supabase offers query failed, fallback:", err);
    }
  }

  // Local store fallback: return offers for Priya (alum)
  const alumId = localStore.profiles[0].id;
  let offers = localStore.offers.filter((o) => o.user_id === alumId);
  if (statusFilter) {
    offers = offers.filter((o) => o.status === statusFilter);
  }

  const enriched = offers.map((o) => ({
    ...o,
    domains: localStore.domains.filter((d) => (o.domain_ids || []).includes(d.id)),
    help_type: localStore.helpTypes.find((ht) => ht.id === o.help_type_id),
  }));

  return NextResponse.json({ offers: enriched });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createOfferSchema.parse(body);

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "alum") {
        return NextResponse.json(
          { error: "Only verified alumni can publish mentoring offers" },
          { status: 403 }
        );
      }

      const { data: newOffer, error: insertError } = await supabase
        .from("offers")
        .insert({
          user_id: user.id,
          title: validated.title,
          description: validated.description,
          help_type_id: validated.help_type_id,
          status: validated.status,
          opportunity_available: validated.opportunity_available,
          opportunity_title: validated.opportunity_title || null,
          opportunity_company: validated.opportunity_company || null,
          opportunity_link: validated.opportunity_link || null,
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      const domainRows = validated.domain_ids.map((domain_id) => ({
        offer_id: newOffer.id,
        domain_id,
      }));

      await supabase.from("offer_domains").insert(domainRows);

      return NextResponse.json({ offer: newOffer }, { status: 201 });
    }

    // Local Store fallback
    const alumUser = localStore.profiles[0];
    const newOffer: Offer & { domain_ids: string[] } = {
      id: crypto.randomUUID(),
      user_id: alumUser.id,
      title: validated.title,
      description: validated.description,
      help_type_id: validated.help_type_id,
      status: validated.status,
      opportunity_available: validated.opportunity_available,
      opportunity_title: validated.opportunity_title || undefined,
      opportunity_company: validated.opportunity_company || undefined,
      opportunity_link: validated.opportunity_link || undefined,
      domain_ids: validated.domain_ids,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localStore.offers.unshift(newOffer);

    return NextResponse.json(
      {
        offer: {
          ...newOffer,
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
