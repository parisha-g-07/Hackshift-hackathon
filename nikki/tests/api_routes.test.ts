import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getHealth } from "@/app/api/health/route";
import { GET as getDomains } from "@/app/api/domains/route";
import { GET as getHelpTypes } from "@/app/api/help-types/route";
import { GET as getTokensBalance } from "@/app/api/tokens/balance/route";
import { GET as getCapacity } from "@/app/api/capacity/route";
import { GET as getIntents, POST as postIntent } from "@/app/api/intents/route";
import { GET as getMatches } from "@/app/api/matches/route";
import { GET as getDashboardMetrics } from "@/app/api/dashboard/metrics/route";
import { POST as postReport } from "@/app/api/reports/route";
import { POST as postRegister } from "@/app/api/auth/register/route";
import { POST as postDemoLogin } from "@/app/api/auth/demo-login/route";

describe("API Route Handlers Integration", () => {
  it("GET /api/health returns 200 and healthy status", async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
    expect(data.scoringVersion).toBe("matching_weights_v1");
  });

  it("GET /api/domains returns canonical list of domains", async () => {
    const res = await getDomains();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.domains)).toBe(true);
    expect(data.domains.length).toBeGreaterThanOrEqual(10);
    expect(data.domains[0]).toHaveProperty("slug");
    expect(data.domains[0]).toHaveProperty("name");
  });

  it("GET /api/help-types returns canonical help types", async () => {
    const res = await getHelpTypes();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.helpTypes)).toBe(true);
    expect(data.helpTypes.length).toBeGreaterThanOrEqual(5);
    expect(data.helpTypes.some((h: any) => h.slug === "referral")).toBe(true);
    expect(data.helpTypes.some((h: any) => h.slug === "mock-interview")).toBe(true);
  });

  it("GET /api/tokens/balance returns student token summary", async () => {
    const res = await getTokensBalance();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("tokens_granted");
    expect(data).toHaveProperty("tokens_remaining");
    expect(data.tokens_remaining).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.ledger)).toBe(true);
  });

  it("GET /api/capacity returns alumni review capacity summary", async () => {
    const res = await getCapacity();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("monthly_limit");
    expect(data.monthly_limit).toBeGreaterThan(0);
    expect(data).toHaveProperty("remaining_capacity");
    expect(data.remaining_capacity).toBeGreaterThanOrEqual(0);
  });

  it("GET /api/intents and POST /api/intents lifecycle", async () => {
    const reqGet = new NextRequest("http://localhost:3000/api/intents");
    const resGet = await getIntents(reqGet);
    expect(resGet.status).toBe(200);
    const initialData = await resGet.json();
    expect(Array.isArray(initialData.intents)).toBe(true);

    // Create a new intent with snake_case keys as required by createIntentSchema
    const payload = {
      title: "Preparation for Quantitative Finance Summer Analyst",
      description: "Looking for advice on mental math drills and stochastic calculus prep for hedge fund interviews.",
      help_type_id: "22222222-2222-2222-2222-222222222204", // career guidance
      target_company: "Citadel",
      target_role: "Quantitative Trader",
      domain_ids: ["11111111-1111-1111-1111-111111111107"], // Finance
    };

    const reqPost = new NextRequest("http://localhost:3000/api/intents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const resPost = await postIntent(reqPost);
    expect(resPost.status).toBe(201);
    const postData = await resPost.json();
    expect(postData.intent).toBeDefined();
    expect(postData.intent.title).toBe(payload.title);
    expect(postData.intent.status).toBe("open");
  });

  it("GET /api/matches returns ranked results with deterministic scores", async () => {
    const req = new NextRequest("http://localhost:3000/api/matches?intentId=44444444-4444-4444-4444-444444444401");
    const res = await getMatches(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.matches)).toBe(true);
    expect(data.matches.length).toBeGreaterThan(0);

    const firstMatch = data.matches[0];
    expect(firstMatch).toHaveProperty("total_score");
    expect(firstMatch).toHaveProperty("d_score");
    expect(firstMatch).toHaveProperty("h_score");
    expect(firstMatch).toHaveProperty("c_score");
    expect(firstMatch).toHaveProperty("r_score");
    expect(firstMatch).toHaveProperty("factors");
    expect(firstMatch.factors?.domainScore).toBe(firstMatch.d_score);
    expect(firstMatch.factors?.helpTypeScore).toBe(firstMatch.h_score);
    expect(firstMatch.factors?.capacityScore).toBe(firstMatch.c_score);
    expect(firstMatch.factors?.recentActivityScore).toBe(firstMatch.r_score);
    expect(firstMatch.factors?.totalScore).toBe(firstMatch.total_score);
    expect(firstMatch.scoreVersion).toBe("matching_weights_v1");

    // Total score is in [0, 100]
    expect(firstMatch.total_score).toBeGreaterThanOrEqual(0);
    expect(firstMatch.total_score).toBeLessThanOrEqual(100);

    // Verify ordering is descending by total_score
    for (let i = 1; i < data.matches.length; i++) {
      expect(data.matches[i - 1].total_score).toBeGreaterThanOrEqual(data.matches[i].total_score);
    }
  });

  it("GET /api/dashboard/metrics returns real aggregated metrics", async () => {
    const res = await getDashboardMetrics();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary).toBeDefined();
    expect(data.summary.activeVerifiedStudents).toBeGreaterThan(0);
    expect(data.summary.activeVerifiedAlumni).toBeGreaterThan(0);
    expect(data.summary.fulfilledGoals).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.domainBreakdown)).toBe(true);
    expect(Array.isArray(data.funnel)).toBe(true);
  });

  it("POST /api/reports submits confidential moderation report", async () => {
    const payload = {
      target_type: "intent",
      target_id: "55555555-5555-5555-5555-555555555501",
      reason: "Suspicious solicitations or commercial advertising",
      details: "User posted external paid service link in request details.",
    };

    const req = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await postReport(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reportId).toBeDefined();
  });

  it("POST /api/auth/register validates email and password lengths", async () => {
    const invalidEmailReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid-email", password: "123" }),
    });
    const resInvalid = await postRegister(invalidEmailReq);
    expect(resInvalid.status).toBe(400);

    const shortPassReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "valid@dtu.ac.in", password: "123" }),
    });
    const resPass = await postRegister(shortPassReq);
    expect(resPass.status).toBe(400);
  });

  it("POST /api/auth/demo-login returns valid credentials for google and student", async () => {
    const googleReq = new NextRequest("http://localhost:3000/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "google" }),
    });
    const resGoogle = await postDemoLogin(googleReq);
    expect(resGoogle.status).toBe(200);
    const googleData = await resGoogle.json();
    expect(googleData.success).toBe(true);
    expect(googleData.role).toBe("student");
    expect(googleData.provider).toBe("google");
    expect(googleData.password).toBeDefined();

    const alumReq = new NextRequest("http://localhost:3000/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "linkedin" }),
    });
    const resAlum = await postDemoLogin(alumReq);
    expect(resAlum.status).toBe(200);
    const alumData = await resAlum.json();
    expect(alumData.success).toBe(true);
    expect(alumData.role).toBe("alum");
    expect(alumData.provider).toBe("linkedin_oidc");
  });
});
