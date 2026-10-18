/**
 * Server and public environment configuration with validation and safe defaults.
 * Secrets are never exposed to browser client bundles or logged.
 */
export const SERVER_CONFIG = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  monthlyTokenGrant: Number(process.env.STUDENT_MONTHLY_TOKEN_GRANT || 5),
  studentPilotYears: (process.env.STUDENT_PILOT_YEARS || "3,4")
    .split(",")
    .map((y) => parseInt(y.trim(), 10))
    .filter((n) => !isNaN(n)),
  alumniPilotCohortCount: Number(process.env.ALUMNI_PILOT_COHORT_COUNT || 3),
  connectionRequestExpiryDays: Number(
    process.env.CONNECTION_REQUEST_EXPIRY_DAYS || process.env.REQUEST_EXPIRY_DAYS || 14
  ),
  matchScoreVersion: process.env.MATCH_SCORE_VERSION || "matching_weights_v1",
} as const;

export function validateServerEnv(): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (SERVER_CONFIG.monthlyTokenGrant <= 0) {
    issues.push("STUDENT_MONTHLY_TOKEN_GRANT must be a positive integer");
  }

  if (SERVER_CONFIG.connectionRequestExpiryDays <= 0) {
    issues.push("CONNECTION_REQUEST_EXPIRY_DAYS must be a positive integer");
  }

  if (SERVER_CONFIG.studentPilotYears.length === 0) {
    issues.push("STUDENT_PILOT_YEARS must specify at least one valid year (e.g. 3,4)");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
