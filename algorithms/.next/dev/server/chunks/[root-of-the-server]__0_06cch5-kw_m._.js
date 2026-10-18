module.exports = [
(()=>{"use strict";return[
"[project]/app/api/dashboard/metrics/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-route] (ecmascript)");
;
;
;
const dynamic = "force-dynamic";
async function GET() {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSupabaseConfigured"])()) {
        try {
            const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerSupabaseClient"])();
            // 1. Total counts
            const { count: totalStudents } = await supabase.from("profiles").select("*", {
                count: "exact",
                head: true
            }).eq("role", "student").eq("is_active", true);
            const { count: totalAlumni } = await supabase.from("profiles").select("*", {
                count: "exact",
                head: true
            }).eq("role", "alum").eq("is_active", true);
            const { count: intentsPosted } = await supabase.from("intents").select("*", {
                count: "exact",
                head: true
            });
            const { count: totalRequests } = await supabase.from("connection_requests").select("*", {
                count: "exact",
                head: true
            });
            const { count: acceptedRequests } = await supabase.from("connection_requests").select("*", {
                count: "exact",
                head: true
            }).eq("status", "accepted");
            const { count: inProgressGoals } = await supabase.from("goals").select("*", {
                count: "exact",
                head: true
            }).eq("status", "in_progress");
            const { count: fulfilledGoals } = await supabase.from("goals").select("*", {
                count: "exact",
                head: true
            }).eq("status", "fulfilled");
            // Network Connectivity % = 100 * unique pairs / (eligible students * eligible alumni)
            const students = totalStudents || 1;
            const alumni = totalAlumni || 1;
            const possiblePairs = students * alumni;
            const uniquePairs = acceptedRequests || 0;
            const connectivityScore = possiblePairs > 0 ? Math.round(1000 * uniquePairs / possiblePairs) / 10 : 0;
            // Goal fulfillment rate = fulfilled / (accepted || 1)
            const fulfillmentRate = acceptedRequests && acceptedRequests > 0 ? Math.round(1000 * (fulfilledGoals || 0) / acceptedRequests) / 10 : 0;
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                isSampleData: false,
                summary: {
                    uniqueAcceptedConnections: acceptedRequests || 0,
                    intentsPosted: intentsPosted || 0,
                    fulfilledGoals: fulfilledGoals || 0,
                    fulfillmentRate,
                    connectivityScore,
                    possiblePairs,
                    activeVerifiedStudents: students,
                    activeVerifiedAlumni: alumni
                },
                funnel: [
                    {
                        stage: "Intents Posted",
                        count: intentsPosted || 0
                    },
                    {
                        stage: "Requests Sent",
                        count: totalRequests || 0
                    },
                    {
                        stage: "Accepted Reviews",
                        count: acceptedRequests || 0
                    },
                    {
                        stage: "In Progress",
                        count: (inProgressGoals || 0) + (fulfilledGoals || 0)
                    },
                    {
                        stage: "Mutually Fulfilled",
                        count: fulfilledGoals || 0
                    }
                ],
                domainBreakdown: [
                    {
                        domain: "Product Management",
                        connections: 12
                    },
                    {
                        domain: "AI & Machine Learning",
                        connections: 10
                    },
                    {
                        domain: "Web Development",
                        connections: 9
                    },
                    {
                        domain: "Data Science",
                        connections: 7
                    },
                    {
                        domain: "Finance & FinTech",
                        connections: 6
                    }
                ],
                capacityUtilization: {
                    totalLimit: 45,
                    allocated: 28,
                    utilizationPercent: 62.2
                }
            });
        } catch (err) {
            console.warn("Supabase metrics query error, using local demo data:", err);
        }
    }
    // Standalone / Seed Mode with explicitly labeled sample data
    const studentsCount = 42;
    const alumniCount = 28;
    const possiblePairs = studentsCount * alumniCount; // 1176
    const acceptedPairs = 64;
    const connectivityScore = Math.round(1000 * acceptedPairs / possiblePairs) / 10; // 5.4%
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        isSampleData: true,
        sampleNotice: "Displaying pilot demo dataset computed from seed test records.",
        summary: {
            uniqueAcceptedConnections: acceptedPairs,
            intentsPosted: 89,
            fulfilledGoals: 38,
            fulfillmentRate: 59.4,
            connectivityScore,
            possiblePairs,
            activeVerifiedStudents: studentsCount,
            activeVerifiedAlumni: alumniCount,
            weeklyActiveUsers: 54,
            avgConnectionsPerActiveUser: 1.8
        },
        funnel: [
            {
                stage: "Intents Posted",
                count: 89,
                percentage: 100
            },
            {
                stage: "Requests Sent",
                count: 76,
                percentage: 85.4
            },
            {
                stage: "Accepted Reviews",
                count: 64,
                percentage: 71.9
            },
            {
                stage: "In Progress",
                count: 52,
                percentage: 58.4
            },
            {
                stage: "Mutually Fulfilled",
                count: 38,
                percentage: 42.7
            }
        ],
        domainBreakdown: [
            {
                domain: "Product Management",
                connections: 22
            },
            {
                domain: "AI & Machine Learning",
                connections: 18
            },
            {
                domain: "Web Development",
                connections: 15
            },
            {
                domain: "Data Science",
                connections: 11
            },
            {
                domain: "Finance & Investment",
                connections: 9
            },
            {
                domain: "Cybersecurity",
                connections: 5
            }
        ],
        topHubs: [
            {
                name: "Priya Sharma (Stripe)",
                connections: 9,
                domain: "Product Management",
                fulfilled: 7
            },
            {
                name: "Marcus Chen (DeepMind)",
                connections: 8,
                domain: "AI/ML",
                fulfilled: 6
            },
            {
                name: "Ananya Patel (Vercel)",
                connections: 7,
                domain: "Web Dev",
                fulfilled: 5
            },
            {
                name: "David Kim (McKinsey)",
                connections: 6,
                domain: "Consulting",
                fulfilled: 4
            },
            {
                name: "Elena Rostova (Goldman)",
                connections: 5,
                domain: "Finance",
                fulfilled: 4
            }
        ],
        tokenAccounting: {
            totalGranted: 210,
            totalSpent: 76,
            remainingInCirculation: 134,
            failedAttemptsDeducted: 0
        },
        capacityUtilization: {
            totalMonthlyCapacity: 84,
            reservedSlots: 12,
            processedSlots: 52,
            utilizationRate: 76.2,
            zeroCapacitySearchesBlocked: 14
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
"[project]/lib/supabase/server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createServerSupabaseClient",
    ()=>createServerSupabaseClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
;
;
async function createServerSupabaseClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
    const supabaseUrl = ("TURBOPACK compile-time value", "https://dvlmiwonanctdbvjgjto.supabase.co") || "https://placeholder-project.supabase.co";
    const supabaseAnonKey = ("TURBOPACK compile-time value", "sb_publishable_KYH4udSf1rEEP5lYyeTlbg_ajNdyokU") || "placeholder-anon-key";
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerClient"])(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>{
                        cookieStore.set(name, value, options);
                    });
                } catch  {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing user sessions.
                }
            }
        }
    });
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

//# sourceMappingURL=%5Broot-of-the-server%5D__0_06cch5-kw_m._.js.map