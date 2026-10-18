module.exports = [
(()=>{"use strict";return[
"[project]/app/api/auth/demo-login/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/admin.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/config.ts [app-route] (ecmascript)");
;
;
;
const dynamic = "force-dynamic";
const DEMO_PASSWORD = "PilotPassword2026!";
const DEMO_ACCOUNTS = {
    google: {
        email: "alex.google.student@gmail.com",
        fullName: "Alex Chen (Google)",
        role: "student",
        institution: "Delhi Technological University",
        studyYear: 4,
        provider: "google",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    linkedin: {
        email: "sarah.linkedin.alum@syncties.com",
        fullName: "Sarah Jenkins (LinkedIn)",
        role: "alum",
        institution: "Delhi Technological University",
        company: "Stripe",
        jobTitle: "Staff Software Engineer",
        industry: "Fintech & Payments",
        graduationYear: 2023,
        provider: "linkedin_oidc",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    student: {
        email: "nikki.artistics@gmail.com",
        fullName: "Nikki Kumar (Student)",
        role: "student",
        institution: "Delhi Technological University",
        studyYear: 3,
        provider: "email",
        avatarUrl: null
    },
    alum: {
        email: "timetable.scheduler.dtu@gmail.com",
        fullName: "HR Alumnus",
        role: "alum",
        institution: "Delhi Technological University",
        company: "Google",
        jobTitle: "Senior Product Manager",
        industry: "Big Tech",
        graduationYear: 2024,
        provider: "email",
        avatarUrl: null
    }
};
async function POST(request) {
    try {
        const body = await request.json();
        const type = body.type || "student";
        const config = DEMO_ACCOUNTS[type] || DEMO_ACCOUNTS.student;
        const email = body.email && typeof body.email === "string" && body.email.includes("@") ? body.email.trim().toLowerCase() : config.email;
        // In unit test or offline mode without live Supabase
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSupabaseConfigured"])()) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                email,
                password: DEMO_PASSWORD,
                role: config.role,
                fullName: config.fullName,
                provider: config.provider
            });
        }
        const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createAdminClient"])();
        // 1. Locate or create the auth user
        const { data: listData } = await admin.auth.admin.listUsers();
        const existing = listData?.users?.find((u)=>u.email?.toLowerCase() === email.toLowerCase());
        let userId;
        if (!existing) {
            const { data: created, error: createErr } = await admin.auth.admin.createUser({
                email,
                password: DEMO_PASSWORD,
                email_confirm: true,
                user_metadata: {
                    full_name: config.fullName,
                    role: config.role,
                    provider: config.provider,
                    avatar_url: config.avatarUrl
                }
            });
            if (createErr || !created?.user) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: createErr?.message || "Failed to create demo user"
                }, {
                    status: 500
                });
            }
            userId = created.user.id;
        } else {
            userId = existing.id;
            // Ensure password and confirmation
            await admin.auth.admin.updateUserById(userId, {
                password: DEMO_PASSWORD,
                email_confirm: true,
                user_metadata: {
                    ...existing.user_metadata,
                    full_name: existing.user_metadata?.full_name || config.fullName,
                    role: existing.user_metadata?.role || config.role,
                    provider: config.provider,
                    avatar_url: existing.user_metadata?.avatar_url || config.avatarUrl
                }
            });
        }
        // 2. Ensure profile exists and is verified in public.profiles
        const profilePayload = {
            id: userId,
            email,
            full_name: config.fullName,
            role: config.role,
            institution: config.institution,
            verification_status: "verified",
            is_active: true,
            updated_at: new Date().toISOString()
        };
        if (config.role === "student") {
            profilePayload.study_year = config.studyYear || 3;
        } else {
            profilePayload.company = config.company || "Technology Partner";
            profilePayload.job_title = config.jobTitle || "Mentor";
            profilePayload.industry = config.industry || "Software Engineering";
            profilePayload.graduation_year = config.graduationYear || 2024;
        }
        if (config.avatarUrl) {
            profilePayload.avatar_url = config.avatarUrl;
        }
        await admin.from("profiles").upsert(profilePayload, {
            onConflict: "id"
        });
        // 3. For alumni, ensure they have at least one active offer for instant matching demo
        if (config.role === "alum") {
            const { data: existingOffers } = await admin.from("offers").select("id").eq("user_id", userId).limit(1);
            if (!existingOffers || existingOffers.length === 0) {
                // Fetch help type & domain
                const { data: helpTypes } = await admin.from("help_types").select("id").limit(1);
                const { data: domains } = await admin.from("domains").select("id").limit(2);
                if (helpTypes?.[0] && domains?.length) {
                    const { data: newOffer } = await admin.from("offers").insert({
                        user_id: userId,
                        title: "Career Guidance & Technical Mentorship",
                        description: "Open to system design reviews, interview preparation, and capstone guidance for juniors.",
                        help_type_id: helpTypes[0].id,
                        status: "active"
                    }).select().single();
                    if (newOffer) {
                        await admin.from("offer_domains").insert(domains.map((d)=>({
                                offer_id: newOffer.id,
                                domain_id: d.id
                            })));
                    }
                }
            }
        }
        // 4. Return credentials for seamless client authentication
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            email,
            password: DEMO_PASSWORD,
            role: config.role,
            fullName: config.fullName,
            provider: config.provider
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Internal server error";
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: message
        }, {
            status: 500
        });
    }
}
}),
"[project]/lib/supabase/admin.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createAdminClient",
    ()=>createAdminClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
function createAdminClient() {
    const supabaseUrl = ("TURBOPACK compile-time value", "https://dvlmiwonanctdbvjgjto.supabase.co") || "https://placeholder-project.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ("TURBOPACK compile-time value", "sb_publishable_KYH4udSf1rEEP5lYyeTlbg_ajNdyokU") || "placeholder-key";
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
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

//# sourceMappingURL=%5Broot-of-the-server%5D__0bi7qj9b_iqj_._.js.map