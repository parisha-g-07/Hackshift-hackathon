import crypto from "crypto";
import OpenAI from "openai";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface BriefParams {
  studentId: string;
  alumId: string;
  intentId: string;
  offerId?: string;
  studentGoal: string;
  helpTypeRequested: string;
  alumniName: string;
  alumniRole?: string;
  alumniCompany?: string;
  alumniDomains: string[];
  offerTitle?: string;
}

/**
 * Creates deterministic hash of input parameters for versioned caching
 */
export function generateInputHash(params: BriefParams): string {
  const content = [
    params.studentGoal,
    params.helpTypeRequested,
    params.alumniName,
    params.alumniRole || "",
    params.alumniCompany || "",
    params.alumniDomains.sort().join(","),
    params.offerTitle || "",
  ].join("|");

  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Deterministic template fallback when OpenAI API is unavailable or missing
 */
export function generateDeterministicFallbackBrief(params: BriefParams): string {
  const domainText =
    params.alumniDomains.length > 0
      ? params.alumniDomains.slice(0, 2).join(" and ")
      : "their field";

  const companyText = params.alumniCompany ? ` at ${params.alumniCompany}` : "";
  const roleText = params.alumniRole ? ` as ${params.alumniRole}${companyText}` : "";

  return `${params.alumniName} has declared professional experience${roleText} in ${domainText} and offers ${params.helpTypeRequested.toLowerCase()}. This directly addresses your goal of "${params.studentGoal}." Review their profile to decide whether to spend 1 monthly token on a connection request.`;
}

/**
 * Server-side AI brief generator with caching and graceful fallback
 */
export async function getOrGenerateConnectionBrief(params: BriefParams): Promise<{
  brief: string;
  isAiGenerated: boolean;
  cached: boolean;
}> {
  const inputHash = generateInputHash(params);

  // 1. Check database cache if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: cached } = await supabase
        .from("connection_briefs")
        .select("brief_text")
        .eq("student_id", params.studentId)
        .eq("alum_id", params.alumId)
        .eq("intent_id", params.intentId)
        .eq("input_hash", inputHash)
        .maybeSingle();

      if (cached?.brief_text) {
        return {
          brief: cached.brief_text,
          isAiGenerated: true,
          cached: true,
        };
      }
    } catch {
      // Ignore cache lookup failure and continue
    }
  }

  // 2. If no OpenAI key, return grounded deterministic fallback
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0 || apiKey.startsWith("your-")) {
    return {
      brief: generateDeterministicFallbackBrief(params),
      isAiGenerated: false,
      cached: false,
    };
  }

  // 3. Call OpenAI with strict grounding instructions
  try {
    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const prompt = `You are an AI assistant for SyncTies, an alumni networking platform.
Generate a concise, professional 2-sentence "Why you should connect" explanation for a student considering reaching out to an alumnus.

STRICT GROUNDING RULES:
- Use ONLY the facts provided below.
- NEVER invent qualifications, job openings, personal connections, or guarantee referrals or interviews.
- Keep the tone encouraging, objective, and restrained.
- Maximum 3 sentences and under 70 words.

DATA:
- Student Goal: "${params.studentGoal}"
- Requested Help: "${params.helpTypeRequested}"
- Alumnus Name: "${params.alumniName}"
- Alumnus Title: "${params.alumniRole || 'Alumnus'}"
- Alumnus Company: "${params.alumniCompany || 'Industry Professional'}"
- Alumnus Domains: ${params.alumniDomains.join(", ")}
- Offered Help: "${params.offerTitle || params.helpTypeRequested}"
`;

    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.3, // Low temperature for deterministic factual grounding
    });

    const briefText = response.choices[0]?.message?.content?.trim();

    if (briefText && briefText.length > 20) {
      // Store in DB cache if Supabase is active
      if (isSupabaseConfigured()) {
        try {
          const supabase = await createServerSupabaseClient();
          await supabase.from("connection_briefs").upsert(
            {
              student_id: params.studentId,
              alum_id: params.alumId,
              intent_id: params.intentId,
              offer_id: params.offerId || null,
              input_hash: inputHash,
              brief_text: briefText,
              model_id: model,
            },
            { onConflict: "student_id,alum_id,intent_id,input_hash" }
          );
        } catch {
          // Non-fatal if caching fails
        }
      }

      return {
        brief: briefText,
        isAiGenerated: true,
        cached: false,
      };
    }
  } catch (error) {
    console.warn("OpenAI API call failed, falling back to deterministic template:", error);
  }

  // Fallback if AI call threw or returned empty
  return {
    brief: generateDeterministicFallbackBrief(params),
    isAiGenerated: false,
    cached: false,
  };
}
