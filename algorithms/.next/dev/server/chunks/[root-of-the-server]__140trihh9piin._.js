module.exports = [
(()=>{"use strict";return[
"[project]/app/api/offers/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .object>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .string>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .enum>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .boolean>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .literal>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .array>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$ZodError$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .ZodError>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/config.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase/server.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/data/store.ts [app-route] (ecmascript)");
;
;
;
;
;
const dynamic = "force-dynamic";
const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const createOfferSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().min(5, "Title must be at least 5 characters").max(120),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().min(15, "Description must be at least 15 characters").max(2000),
    help_type_id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().regex(uuidPattern, "Invalid help type identifier"),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum([
        "active",
        "paused",
        "closed",
        "draft"
    ]).default("active"),
    opportunity_available: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean().default(false),
    opportunity_title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().max(100).optional().nullable(),
    opportunity_company: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().max(100).optional().nullable(),
    opportunity_link: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().url().optional().nullable().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("")),
    domain_ids: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().regex(uuidPattern, "Invalid domain identifier")).min(1, "Select at least 1 domain")
});
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSupabaseConfigured"])()) {
        try {
            const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerSupabaseClient"])();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Unauthorized"
                }, {
                    status: 401
                });
            }
            let query = supabase.from("offers").select(`
          *,
          help_type:help_types(*),
          domains:offer_domains(domain:domains(*))
        `).eq("user_id", user.id).order("created_at", {
                ascending: false
            });
            if (statusFilter) {
                query = query.eq("status", statusFilter);
            }
            const { data, error } = await query;
            if (error) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: error.message
            }, {
                status: 500
            });
            const formatted = (data || []).map((o)=>({
                    ...o,
                    domains: o.domains?.map((d)=>d.domain) || []
                }));
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                offers: formatted
            });
        } catch (err) {
            console.warn("Supabase offers query failed, fallback:", err);
        }
    }
    // Local store fallback: return offers for Priya (alum)
    const alumId = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["localStore"].profiles[0].id;
    let offers = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["localStore"].offers.filter((o)=>o.user_id === alumId);
    if (statusFilter) {
        offers = offers.filter((o)=>o.status === statusFilter);
    }
    const enriched = offers.map((o)=>({
            ...o,
            domains: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["localStore"].domains.filter((d)=>(o.domain_ids || []).includes(d.id)),
            help_type: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["localStore"].helpTypes.find((ht)=>ht.id === o.help_type_id)
        }));
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        offers: enriched
    });
}
async function POST(req) {
    try {
        const body = await req.json();
        const validated = createOfferSchema.parse(body);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSupabaseConfigured"])()) {
            const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createServerSupabaseClient"])();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Unauthorized"
                }, {
                    status: 401
                });
            }
            const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
            if (profile?.role !== "alum") {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Only verified alumni can publish mentoring offers"
                }, {
                    status: 403
                });
            }
            const { data: newOffer, error: insertError } = await supabase.from("offers").insert({
                user_id: user.id,
                title: validated.title,
                description: validated.description,
                help_type_id: validated.help_type_id,
                status: validated.status,
                opportunity_available: validated.opportunity_available,
                opportunity_title: validated.opportunity_title || null,
                opportunity_company: validated.opportunity_company || null,
                opportunity_link: validated.opportunity_link || null
            }).select().single();
            if (insertError) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: insertError.message
                }, {
                    status: 500
                });
            }
            const domainRows = validated.domain_ids.map((domain_id)=>({
                    offer_id: newOffer.id,
                    domain_id
                }));
            await supabase.from("offer_domains").insert(domainRows);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                offer: newOffer
            }, {
                status: 201
            });
        }
        // Local Store fallback
        const alumUser = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["localStore"].profiles[0];
        const newOffer = {
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
            updated_at: new Date().toISOString()
        };
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["localStore"].offers.unshift(newOffer);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            offer: {
                ...newOffer,
                domains: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["localStore"].domains.filter((d)=>validated.domain_ids.includes(d.id)),
                help_type: __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$data$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["localStore"].helpTypes.find((h)=>h.id === validated.help_type_id)
            }
        }, {
            status: 201
        });
    } catch (err) {
        if (err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$ZodError$3e$__["z"].ZodError) {
            const msg = err.issues?.[0]?.message || err.errors?.[0]?.message || "Validation failed";
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: msg
            }, {
                status: 400
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Internal Server Error"
        }, {
            status: 500
        });
    }
}
}),
"[project]/lib/data/store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CANONICAL_DOMAINS",
    ()=>CANONICAL_DOMAINS,
    "CANONICAL_HELP_TYPES",
    ()=>CANONICAL_HELP_TYPES,
    "HELP_TYPE_COMPATIBILITY_MAP",
    ()=>HELP_TYPE_COMPATIBILITY_MAP,
    "SEED_CAPACITIES",
    ()=>SEED_CAPACITIES,
    "SEED_GOALS",
    ()=>SEED_GOALS,
    "SEED_INTENTS",
    ()=>SEED_INTENTS,
    "SEED_OFFERS",
    ()=>SEED_OFFERS,
    "SEED_PROFILES",
    ()=>SEED_PROFILES,
    "SEED_REQUESTS",
    ()=>SEED_REQUESTS,
    "localStore",
    ()=>localStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$matching$2f$score$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/matching/score.ts [app-route] (ecmascript)");
;
const CANONICAL_DOMAINS = [
    {
        id: "11111111-1111-1111-1111-111111111101",
        slug: "computer-science",
        name: "Computer Science",
        category: "Technology",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111102",
        slug: "data-science",
        name: "Data Science",
        category: "Technology",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111103",
        slug: "ai-ml",
        name: "AI & Machine Learning",
        category: "Technology",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111104",
        slug: "web-development",
        name: "Web Development",
        category: "Technology",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111105",
        slug: "cybersecurity",
        name: "Cybersecurity",
        category: "Technology",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111106",
        slug: "product-management",
        name: "Product Management",
        category: "Business & Product",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111107",
        slug: "finance",
        name: "Finance & Investment",
        category: "Business & Finance",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111108",
        slug: "consulting",
        name: "Consulting & Strategy",
        category: "Business & Strategy",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111109",
        slug: "design",
        name: "UI/UX & Product Design",
        category: "Design",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111110",
        slug: "research",
        name: "Academic & Industrial Research",
        category: "Research",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "entrepreneurship",
        name: "Entrepreneurship & Startups",
        category: "Business",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111112",
        slug: "marketing",
        name: "Growth & Marketing",
        category: "Business",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111113",
        slug: "healthcare",
        name: "Healthcare & BioTech",
        category: "Life Sciences",
        is_active: true
    },
    {
        id: "11111111-1111-1111-1111-111111111114",
        slug: "other",
        name: "Other Professional Domains",
        category: "General",
        is_active: true
    }
];
const CANONICAL_HELP_TYPES = [
    {
        id: "22222222-2222-2222-2222-222222222201",
        slug: "referral",
        name: "Job or Internship Referral",
        description: "Direct internal employee referral for an active opening",
        is_active: true
    },
    {
        id: "22222222-2222-2222-2222-222222222202",
        slug: "mock-interview",
        name: "Mock Interview & Feedback",
        description: "Technical, behavioral, or product case interview simulation",
        is_active: true
    },
    {
        id: "22222222-2222-2222-2222-222222222203",
        slug: "resume-review",
        name: "Resume & CV Review",
        description: "Constructive critique and line-by-line feedback on your resume",
        is_active: true
    },
    {
        id: "22222222-2222-2222-2222-222222222204",
        slug: "career-guidance",
        name: "Career & Field Guidance",
        description: "Strategic advice on role transitions, career roadmap, and industry trends",
        is_active: true
    },
    {
        id: "22222222-2222-2222-2222-222222222205",
        slug: "higher-ed-guidance",
        name: "Higher Education Guidance",
        description: "Advice on master degrees, PhD applications, GRE/GMAT, and universities",
        is_active: true
    },
    {
        id: "22222222-2222-2222-2222-222222222206",
        slug: "portfolio-review",
        name: "Portfolio & Code Review",
        description: "Review of design portfolio, GitHub projects, or open-source PRs",
        is_active: true
    },
    {
        id: "22222222-2222-2222-2222-222222222207",
        slug: "project-guidance",
        name: "Capstone & Project Mentorship",
        description: "Technical direction on university or side projects",
        is_active: true
    },
    {
        id: "22222222-2222-2222-2222-222222222208",
        slug: "other",
        name: "General Mentoring",
        description: "Custom professional discussion",
        is_active: true
    }
];
const HELP_TYPE_COMPATIBILITY_MAP = {
    // exact matches are 100
    "22222222-2222-2222-2222-222222222201:22222222-2222-2222-2222-222222222201": 100,
    "22222222-2222-2222-2222-222222222202:22222222-2222-2222-2222-222222222202": 100,
    "22222222-2222-2222-2222-222222222203:22222222-2222-2222-2222-222222222203": 100,
    "22222222-2222-2222-2222-222222222204:22222222-2222-2222-2222-222222222204": 100,
    "22222222-2222-2222-2222-222222222205:22222222-2222-2222-2222-222222222205": 100,
    "22222222-2222-2222-2222-222222222206:22222222-2222-2222-2222-222222222206": 100,
    "22222222-2222-2222-2222-222222222207:22222222-2222-2222-2222-222222222207": 100,
    "22222222-2222-2222-2222-222222222208:22222222-2222-2222-2222-222222222208": 100,
    // related
    "22222222-2222-2222-2222-222222222202:22222222-2222-2222-2222-222222222204": 70,
    "22222222-2222-2222-2222-222222222203:22222222-2222-2222-2222-222222222204": 70,
    "22222222-2222-2222-2222-222222222206:22222222-2222-2222-2222-222222222203": 70,
    "22222222-2222-2222-2222-222222222207:22222222-2222-2222-2222-222222222204": 70,
    "22222222-2222-2222-2222-222222222201:22222222-2222-2222-2222-222222222202": 40,
    "22222222-2222-2222-2222-222222222201:22222222-2222-2222-2222-222222222203": 40,
    "22222222-2222-2222-2222-222222222205:22222222-2222-2222-2222-222222222204": 70
};
const SEED_PROFILES = [
    {
        id: "33333333-3333-3333-3333-333333333301",
        email: "priya.sharma@alumni.edu",
        full_name: "Priya Sharma",
        avatar_url: "",
        role: "alum",
        institution: "Tech University",
        graduation_year: 2023,
        job_title: "Senior Product Manager",
        company: "Stripe",
        industry: "FinTech & Payments",
        bio: "Ex-APM at Google, currently building global billing infrastructure at Stripe. Happy to conduct mock PM interviews and product sense drills.",
        verification_status: "verified",
        is_active: true,
        last_active_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z"
    },
    {
        id: "33333333-3333-3333-3333-333333333302",
        email: "marcus.chen@alumni.edu",
        full_name: "Marcus Chen",
        avatar_url: "",
        role: "alum",
        institution: "Tech University",
        graduation_year: 2022,
        job_title: "Staff Machine Learning Engineer",
        company: "DeepMind",
        industry: "Artificial Intelligence",
        bio: "Working on generative AI systems. Can assist 4th-year students with technical interview prep and AI capstone design.",
        verification_status: "verified",
        is_active: true,
        last_active_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z"
    },
    {
        id: "33333333-3333-3333-3333-333333333303",
        email: "ananya.patel@alumni.edu",
        full_name: "Ananya Patel",
        avatar_url: "",
        role: "alum",
        institution: "Tech University",
        graduation_year: 2024,
        job_title: "Full-Stack Software Engineer",
        company: "Vercel",
        industry: "Developer Tools",
        bio: "Recent 2024 graduate! Built web systems with Next.js, TypeScript, and edge computing. Excited to review junior resumes and code portfolios.",
        verification_status: "verified",
        is_active: true,
        last_active_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z"
    },
    {
        id: "33333333-3333-3333-3333-333333333304",
        email: "rohan.deshmukh@student.edu",
        full_name: "Rohan Deshmukh",
        avatar_url: "",
        role: "student",
        institution: "Tech University",
        study_year: 4,
        expected_graduation_year: 2027,
        bio: "Final year Computer Science student targeting associate product manager and software engineering graduate roles.",
        verification_status: "verified",
        is_active: true,
        last_active_at: new Date().toISOString(),
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z"
    }
];
const SEED_OFFERS = [
    {
        id: "44444444-4444-4444-4444-444444444401",
        user_id: "33333333-3333-3333-3333-333333333301",
        title: "Product Management Mock Interviews & Portfolio Critique",
        description: "45-minute structured mock interview with real product design, prioritization, and analytical case prompts, followed by detailed feedback.",
        help_type_id: "22222222-2222-2222-2222-222222222202",
        status: "active",
        opportunity_available: true,
        opportunity_title: "APM Fall 2027 Referral Available",
        opportunity_company: "Stripe",
        domain_ids: [
            "11111111-1111-1111-1111-111111111106",
            "11111111-1111-1111-1111-111111111107"
        ],
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z"
    },
    {
        id: "44444444-4444-4444-4444-444444444402",
        user_id: "33333333-3333-3333-3333-333333333302",
        title: "AI/ML Systems Technical Architecture & Interview Prep",
        description: "Deep-dive on ML modeling, inference optimization, and graduate research directions.",
        help_type_id: "22222222-2222-2222-2222-222222222204",
        status: "active",
        opportunity_available: false,
        domain_ids: [
            "11111111-1111-1111-1111-111111111103",
            "11111111-1111-1111-1111-111111111102",
            "11111111-1111-1111-1111-111111111101"
        ],
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z"
    },
    {
        id: "44444444-4444-4444-4444-444444444403",
        user_id: "33333333-3333-3333-3333-333333333303",
        title: "Frontend & Full-Stack Resume Line-by-Line Review",
        description: "Detailed actionable feedback on how to present GitHub open-source projects, Next.js applications, and system design on your resume.",
        help_type_id: "22222222-2222-2222-2222-222222222203",
        status: "active",
        opportunity_available: true,
        opportunity_title: "Software Engineer I Openings",
        opportunity_company: "Vercel",
        domain_ids: [
            "11111111-1111-1111-1111-111111111104",
            "11111111-1111-1111-1111-111111111101"
        ],
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-01T00:00:00Z"
    }
];
const SEED_CAPACITIES = {
    "33333333-3333-3333-3333-333333333301": {
        monthly_limit: 4,
        reserved_count: 1,
        processed_count: 1,
        remaining_capacity: 2,
        period_start: "2026-10-01"
    },
    "33333333-3333-3333-3333-333333333302": {
        monthly_limit: 3,
        reserved_count: 0,
        processed_count: 1,
        remaining_capacity: 2,
        period_start: "2026-10-01"
    },
    "33333333-3333-3333-3333-333333333303": {
        monthly_limit: 5,
        reserved_count: 0,
        processed_count: 0,
        remaining_capacity: 5,
        period_start: "2026-10-01"
    }
};
const SEED_INTENTS = [
    {
        id: "55555555-5555-5555-5555-555555555501",
        user_id: "33333333-3333-3333-3333-333333333304",
        title: "Prepare for Associate Product Manager Case Interviews",
        description: "Looking for advice and mock case interviews focused on product sense, metric definitions, and fintech trade-offs before upcoming campus placements.",
        help_type_id: "22222222-2222-2222-2222-222222222202",
        status: "open",
        target_role: "Associate Product Manager",
        target_company: "Stripe, Razorpay, or Google",
        domain_ids: [
            "11111111-1111-1111-1111-111111111106",
            "11111111-1111-1111-1111-111111111107"
        ],
        created_at: "2026-10-10T10:00:00Z",
        updated_at: "2026-10-10T10:00:00Z"
    }
];
const SEED_REQUESTS = [
    {
        id: "66666666-6666-6666-6666-666666666601",
        student_id: "33333333-3333-3333-3333-333333333304",
        alum_id: "33333333-3333-3333-3333-333333333301",
        intent_id: "55555555-5555-5555-5555-555555555501",
        offer_id: "44444444-4444-4444-4444-444444444401",
        status: "accepted",
        student_message: "Hi Priya! I loved your article on Stripe billing APIs. I'm preparing for APM interviews and would value your feedback on my product design drill.",
        repeat_contact_in_month: false,
        alumni_response_note: "Happy to help Rohan! Let's schedule 45 mins this Saturday.",
        expires_at: "2026-10-24T10:00:00Z",
        responded_at: "2026-10-11T14:30:00Z",
        created_at: "2026-10-10T12:00:00Z",
        updated_at: "2026-10-11T14:30:00Z"
    }
];
const SEED_GOALS = [
    {
        id: "77777777-7777-7777-7777-777777777701",
        request_id: "66666666-6666-6666-6666-666666666601",
        student_id: "33333333-3333-3333-3333-333333333304",
        alum_id: "33333333-3333-3333-3333-333333333301",
        title: "Prepare for Associate Product Manager Case Interviews",
        description: "Complete 1 structured mock interview and review feedback notes.",
        status: "fulfilled",
        student_confirmed_at: "2026-10-14T16:00:00Z",
        alum_confirmed_at: "2026-10-14T17:00:00Z",
        fulfilled_at: "2026-10-14T17:00:00Z",
        created_at: "2026-10-10T12:00:00Z",
        updated_at: "2026-10-14T17:00:00Z"
    }
];
// In-Memory Database Store for Graceful Standalone/Local Operation
class LocalDataStore {
    profiles = [
        ...SEED_PROFILES
    ];
    domains = [
        ...CANONICAL_DOMAINS
    ];
    helpTypes = [
        ...CANONICAL_HELP_TYPES
    ];
    offers = [
        ...SEED_OFFERS
    ];
    intents = [
        ...SEED_INTENTS
    ];
    requests = [
        ...SEED_REQUESTS
    ];
    goals = [
        ...SEED_GOALS
    ];
    capacities = {
        ...SEED_CAPACITIES
    };
    studentTokens = {
        "33333333-3333-3333-3333-333333333304": {
            tokens_granted: 5,
            tokens_spent: 1,
            tokens_remaining: 4,
            period_start: "2026-10-01"
        }
    };
    feedback = [];
    getProfile(id) {
        return this.profiles.find((p)=>p.id === id);
    }
    saveProfile(profile) {
        const existingIndex = this.profiles.findIndex((p)=>p.id === profile.id);
        if (existingIndex >= 0) {
            this.profiles[existingIndex] = {
                ...this.profiles[existingIndex],
                ...profile,
                updated_at: new Date().toISOString()
            };
            return this.profiles[existingIndex];
        } else {
            const newP = {
                email: "user@example.com",
                full_name: "New User",
                role: "student",
                institution: "University Pilot",
                study_year: 3,
                verification_status: "verified",
                is_active: true,
                last_active_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...profile,
                id: profile.id
            };
            this.profiles.push(newP);
            return newP;
        }
    }
    // Matching logic
    getMatchesForIntent(intentId, studentId) {
        const intent = this.intents.find((i)=>i.id === intentId && i.status === "open");
        if (!intent) return [];
        const requestedHelpTypeId = intent.help_type_id;
        const studentDomainIds = intent.domain_ids || [];
        const results = [];
        // Filter active alumni
        const alumni = this.profiles.filter((p)=>p.role === "alum" && p.is_active && p.id !== studentId);
        for (const alum of alumni){
            // Find candidate's active offers
            const alumOffers = this.offers.filter((o)=>o.user_id === alum.id && o.status === "active");
            if (alumOffers.length === 0) continue;
            const cap = this.capacities[alum.id] || {
                monthly_limit: 3,
                reserved_count: 0,
                processed_count: 0,
                remaining_capacity: 3,
                period_start: "2026-10-01"
            };
            if (cap.remaining_capacity <= 0) continue; // Exclude zero capacity
            // Check duplicate pending/accepted request
            const hasDuplicate = this.requests.some((r)=>r.student_id === studentId && r.alum_id === alum.id && r.intent_id === intentId && (r.status === "pending" || r.status === "accepted"));
            if (hasDuplicate) continue;
            // Repeat contact in current month?
            const isRepeat = this.requests.some((r)=>r.student_id === studentId && r.alum_id === alum.id);
            // Score best offer
            let bestOfferScore = -1;
            let bestOfferResult = null;
            for (const offer of alumOffers){
                const dScore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$matching$2f$score$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculateDomainOverlap"])(studentDomainIds, offer.domain_ids || []);
                const hScore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$matching$2f$score$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculateHelpTypeScore"])(requestedHelpTypeId, [
                    offer.help_type_id
                ], HELP_TYPE_COMPATIBILITY_MAP);
                const cScore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$matching$2f$score$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculateCapacityScore"])(cap.monthly_limit, cap.reserved_count + cap.processed_count);
                const rScore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$matching$2f$score$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculateRecentActivityScore"])(alum.last_active_at);
                const totalScore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$matching$2f$score$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculateTotalMatchScore"])(dScore, hScore, cScore, rScore);
                const helpTypeObj = this.helpTypes.find((ht)=>ht.id === offer.help_type_id);
                const matchedDomains = this.domains.filter((d)=>(offer.domain_ids || []).includes(d.id) && studentDomainIds.includes(d.id)).map((d)=>({
                        id: d.id,
                        name: d.name,
                        slug: d.slug
                    }));
                const candidateResult = {
                    alum_id: alum.id,
                    full_name: alum.full_name,
                    avatar_url: alum.avatar_url,
                    job_title: alum.job_title || undefined,
                    company: alum.company || undefined,
                    industry: alum.industry || undefined,
                    bio: alum.bio || undefined,
                    graduation_year: alum.graduation_year || undefined,
                    last_active_at: alum.last_active_at,
                    offer_id: offer.id,
                    offer_title: offer.title,
                    offer_help_type_id: offer.help_type_id,
                    offer_help_type_name: helpTypeObj?.name || "General Guidance",
                    d_score: dScore,
                    h_score: hScore,
                    c_score: cScore,
                    r_score: rScore,
                    total_score: totalScore,
                    matched_domains: matchedDomains,
                    remaining_capacity: cap.remaining_capacity,
                    monthly_limit: cap.monthly_limit,
                    is_repeat_contact: isRepeat
                };
                if (totalScore > bestOfferScore) {
                    bestOfferScore = totalScore;
                    bestOfferResult = candidateResult;
                }
            }
            if (bestOfferResult) {
                results.push(bestOfferResult);
            }
        }
        results.sort(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$matching$2f$score$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["compareCandidates"]);
        return results;
    }
}
const localStore = new LocalDataStore();
}),
"[project]/lib/matching/score.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Pure deterministic score calculation functions for SyncTies Matching Engine.
 * Formula v1: TotalScore = 0.40 * D + 0.30 * H + 0.20 * C + 0.10 * R
 */ __turbopack_context__.s([
    "DEFAULT_WEIGHTS",
    ()=>DEFAULT_WEIGHTS,
    "MATCHING_WEIGHTS_V1",
    ()=>MATCHING_WEIGHTS_V1,
    "calculateCapacityScore",
    ()=>calculateCapacityScore,
    "calculateDomainOverlap",
    ()=>calculateDomainOverlap,
    "calculateHelpTypeScore",
    ()=>calculateHelpTypeScore,
    "calculateRecentActivityScore",
    ()=>calculateRecentActivityScore,
    "calculateTotalMatchScore",
    ()=>calculateTotalMatchScore,
    "compareCandidates",
    ()=>compareCandidates
]);
const MATCHING_WEIGHTS_V1 = {
    version: "v1",
    name: "matching_weights_v1",
    weights: {
        d: 0.40,
        h: 0.30,
        c: 0.20,
        r: 0.10
    },
    halfLifeDays: 14,
    formulaString: "0.40 * D + 0.30 * H + 0.20 * C + 0.10 * R"
};
const DEFAULT_WEIGHTS = MATCHING_WEIGHTS_V1.weights;
function calculateDomainOverlap(studentDomains, alumniDomains) {
    if (!studentDomains || !alumniDomains || studentDomains.length === 0 || alumniDomains.length === 0) {
        return 0;
    }
    const studentSet = new Set(studentDomains);
    const alumniSet = new Set(alumniDomains);
    let intersectionCount = 0;
    for (const item of studentSet){
        if (alumniSet.has(item)) {
            intersectionCount++;
        }
    }
    if (intersectionCount === 0) {
        return 0;
    }
    const unionSet = new Set([
        ...studentDomains,
        ...alumniDomains
    ]);
    const score = 100 * intersectionCount / unionSet.size;
    return Math.round(score * 100) / 100;
}
function calculateHelpTypeScore(requestedHelpTypeId, offeredHelpTypeIds, compatibilityMap) {
    if (!requestedHelpTypeId || !offeredHelpTypeIds || offeredHelpTypeIds.length === 0) {
        return 0;
    }
    let maxScore = 0;
    for (const offeredId of offeredHelpTypeIds){
        if (offeredId === requestedHelpTypeId) {
            return 100; // Exact match is always 100
        }
        const pairKey = `${requestedHelpTypeId}:${offeredId}`;
        const score = compatibilityMap[pairKey] ?? 0;
        if (score > maxScore) {
            maxScore = score;
        }
    }
    return Math.round(maxScore * 100) / 100;
}
function calculateCapacityScore(limit, allocated) {
    if (limit <= 0) return 0;
    const remaining = Math.max(0, limit - allocated);
    const score = 100 * remaining / limit;
    return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}
function calculateRecentActivityScore(lastActiveAt, now = new Date()) {
    if (!lastActiveAt) return 0;
    const date = typeof lastActiveAt === "string" ? new Date(lastActiveAt) : lastActiveAt;
    if (isNaN(date.getTime())) return 0;
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const ageDays = diffMs / (1000 * 60 * 60 * 24);
    const score = 100 * Math.pow(2, -ageDays / 14);
    return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}
function calculateTotalMatchScore(d, h, c, r, weights = DEFAULT_WEIGHTS) {
    const total = weights.d * Math.max(0, Math.min(100, d)) + weights.h * Math.max(0, Math.min(100, h)) + weights.c * Math.max(0, Math.min(100, c)) + weights.r * Math.max(0, Math.min(100, r));
    return Math.round(total * 100) / 100;
}
function compareCandidates(a, b) {
    // 1. Total score descending
    if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
    }
    // 2. Help-type score descending
    if (b.h_score !== a.h_score) {
        return b.h_score - a.h_score;
    }
    // 3. Capacity score descending
    if (b.c_score !== a.c_score) {
        return b.c_score - a.c_score;
    }
    // 4. Recent activity descending
    const dateA = new Date(a.last_active_at).getTime();
    const dateB = new Date(b.last_active_at).getTime();
    if (dateB !== dateA) {
        return dateB - dateA;
    }
    // 5. Stable ID ascending
    return a.alum_id.localeCompare(b.alum_id);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__140trihh9piin._.js.map