module.exports = [
(()=>{"use strict";return[
"[project]/app/api/health/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/config/env.ts [app-route] (ecmascript)");
;
;
;
const dynamic = "force-dynamic";
async function GET() {
    const supabaseConfigured = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSupabaseConfigured"])();
    const openAiConfigured = Boolean(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SERVER_CONFIG"].openAiApiKey && __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SERVER_CONFIG"].openAiApiKey.length > 5);
    const envValidation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateServerEnv"])();
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        status: "ok",
        timestamp: new Date().toISOString(),
        supabaseConfigured,
        openAiConfigured,
        envValidation,
        scoringVersion: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SERVER_CONFIG"].matchScoreVersion,
        monthlyTokenGrant: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SERVER_CONFIG"].monthlyTokenGrant,
        studentPilotYears: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SERVER_CONFIG"].studentPilotYears,
        alumniPilotCohortCount: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SERVER_CONFIG"].alumniPilotCohortCount,
        requestExpiryDays: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$config$2f$env$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SERVER_CONFIG"].connectionRequestExpiryDays
    });
}
}),
"[project]/lib/config/env.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Server and public environment configuration with validation and safe defaults.
 * Secrets are never exposed to browser client bundles or logged.
 */ __turbopack_context__.s([
    "SERVER_CONFIG",
    ()=>SERVER_CONFIG,
    "validateServerEnv",
    ()=>validateServerEnv
]);
const SERVER_CONFIG = {
    appUrl: ("TURBOPACK compile-time value", "http://localhost:3000") || "http://localhost:3000",
    supabaseUrl: ("TURBOPACK compile-time value", "https://dvlmiwonanctdbvjgjto.supabase.co") || "",
    supabaseAnonKey: ("TURBOPACK compile-time value", "sb_publishable_KYH4udSf1rEEP5lYyeTlbg_ajNdyokU") || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    openAiApiKey: process.env.OPENAI_API_KEY || "",
    openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    monthlyTokenGrant: Number(process.env.STUDENT_MONTHLY_TOKEN_GRANT || 5),
    studentPilotYears: (process.env.STUDENT_PILOT_YEARS || "3,4").split(",").map((y)=>parseInt(y.trim(), 10)).filter((n)=>!isNaN(n)),
    alumniPilotCohortCount: Number(process.env.ALUMNI_PILOT_COHORT_COUNT || 3),
    connectionRequestExpiryDays: Number(process.env.CONNECTION_REQUEST_EXPIRY_DAYS || process.env.REQUEST_EXPIRY_DAYS || 14),
    matchScoreVersion: process.env.MATCH_SCORE_VERSION || "matching_weights_v1"
};
function validateServerEnv() {
    const issues = [];
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
        issues
    };
}
}),
"[project]/lib/supabase/config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Check if real Supabase credentials are configured.
 */ __turbopack_context__.s([
    "getSupabaseEnv",
    ()=>getSupabaseEnv,
    "isSupabaseConfigured",
    ()=>isSupabaseConfigured
]);
function isSupabaseConfigured() {
    const url = ("TURBOPACK compile-time value", "https://dvlmiwonanctdbvjgjto.supabase.co");
    const anonKey = ("TURBOPACK compile-time value", "sb_publishable_KYH4udSf1rEEP5lYyeTlbg_ajNdyokU");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (url.includes("placeholder-project") || url.includes("your-project")) return false;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return true;
}
function getSupabaseEnv() {
    return {
        url: ("TURBOPACK compile-time value", "https://dvlmiwonanctdbvjgjto.supabase.co") || "",
        anonKey: ("TURBOPACK compile-time value", "sb_publishable_KYH4udSf1rEEP5lYyeTlbg_ajNdyokU") || "",
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        isConfigured: isSupabaseConfigured()
    };
}
}),
]})(),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__05b5q-0hsqbm8._.js.map