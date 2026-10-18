import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SERVER_CONFIG, validateServerEnv } from "@/lib/config/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseConfigured = isSupabaseConfigured();
  const openAiConfigured = Boolean(SERVER_CONFIG.openAiApiKey && SERVER_CONFIG.openAiApiKey.length > 5);
  const envValidation = validateServerEnv();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabaseConfigured,
    openAiConfigured,
    envValidation,
    scoringVersion: SERVER_CONFIG.matchScoreVersion,
    monthlyTokenGrant: SERVER_CONFIG.monthlyTokenGrant,
    studentPilotYears: SERVER_CONFIG.studentPilotYears,
    alumniPilotCohortCount: SERVER_CONFIG.alumniPilotCohortCount,
    requestExpiryDays: SERVER_CONFIG.connectionRequestExpiryDays,
  });
}
