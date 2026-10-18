import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/store";
import { getOrGenerateConnectionBrief } from "@/lib/ai/brief";
import { MatchResult } from "@/types/database";
import { MATCHING_WEIGHTS_V1 } from "@/lib/matching/score";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const intentId = searchParams.get("intentId");
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

  if (!intentId) {
    return NextResponse.json({ error: "Missing intentId query parameter" }, { status: 400 });
  }

  // 1. If Supabase is configured, use the PostgreSQL RPC
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Verify student owns open intent
      const { data: intent, error: intentError } = await supabase
        .from("intents")
        .select("id, title, help_type:help_types(name)")
        .eq("id", intentId)
        .eq("user_id", user.id)
        .single();

      if (intentError || !intent) {
        return NextResponse.json(
          { error: "Intent not found or unauthorized" },
          { status: 404 }
        );
      }

      // Call pure deterministic matching RPC
      const { data: rpcMatches, error: rpcError } = await supabase.rpc(
        "score_matches_for_intent",
        {
          p_intent_id: intentId,
          p_student_id: user.id,
          p_limit: limit,
          p_offset: offset,
        }
      );

      if (rpcError) {
        console.error("RPC score_matches_for_intent failed:", rpcError);
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }

      const matches: MatchResult[] = (rpcMatches || []).map((m: any) => ({
        ...m,
        d_score: Number(m.d_score),
        h_score: Number(m.h_score),
        c_score: Number(m.c_score),
        r_score: Number(m.r_score),
        total_score: Number(m.total_score),
      }));

      // Generate briefs for top matches
      const enriched = await Promise.all(
        matches.map(async (match) => {
          const briefRes = await getOrGenerateConnectionBrief({
            studentId: user.id,
            alumId: match.alum_id,
            intentId,
            offerId: match.offer_id,
            studentGoal: intent.title,
            helpTypeRequested: (intent.help_type as any)?.name || "Mentorship",
            alumniName: match.full_name,
            alumniRole: match.job_title,
            alumniCompany: match.company,
            alumniDomains: match.matched_domains.map((d) => d.name),
            offerTitle: match.offer_title,
          });

          return {
            ...match,
            brief: briefRes.brief,
            factors: {
              domainScore: match.d_score,
              helpTypeScore: match.h_score,
              capacityScore: match.c_score,
              recentActivityScore: match.r_score,
              totalScore: match.total_score,
            },
            scoreVersion: MATCHING_WEIGHTS_V1.name,
          };
        })
      );

      return NextResponse.json({
        matches: enriched,
        total: enriched.length,
        scoringVersion: MATCHING_WEIGHTS_V1.version,
        scoreVersion: MATCHING_WEIGHTS_V1.name,
        formula: MATCHING_WEIGHTS_V1.formulaString,
      });
    } catch (err) {
      console.warn("Supabase matching query failed, using local store:", err);
    }
  }

  // 2. Standalone fallback using localStore matching engine
  const student = localStore.profiles[3];
  const intent = localStore.intents.find((i) => i.id === intentId) || localStore.intents[0];

  if (!intent) {
    return NextResponse.json({ error: "Intent not found" }, { status: 404 });
  }

  const matches = localStore.getMatchesForIntent(intent.id, student.id);
  const paginated = matches.slice(offset, offset + limit);

  // Generate briefs
  const enriched = await Promise.all(
    paginated.map(async (m) => {
      const briefRes = await getOrGenerateConnectionBrief({
        studentId: student.id,
        alumId: m.alum_id,
        intentId: intent.id,
        offerId: m.offer_id,
        studentGoal: intent.title,
        helpTypeRequested: m.offer_help_type_name,
        alumniName: m.full_name,
        alumniRole: m.job_title,
        alumniCompany: m.company,
        alumniDomains: m.matched_domains.map((d) => d.name),
        offerTitle: m.offer_title,
      });

      return {
        ...m,
        brief: briefRes.brief,
        factors: {
          domainScore: m.d_score,
          helpTypeScore: m.h_score,
          capacityScore: m.c_score,
          recentActivityScore: m.r_score,
          totalScore: m.total_score,
        },
        scoreVersion: MATCHING_WEIGHTS_V1.name,
      };
    })
  );

  return NextResponse.json({
    matches: enriched,
    total: matches.length,
    intent,
    scoringVersion: MATCHING_WEIGHTS_V1.version,
    scoreVersion: MATCHING_WEIGHTS_V1.name,
    formula: MATCHING_WEIGHTS_V1.formulaString,
    isDemo: true,
  });
}
