import { describe, it, expect } from "vitest";
import {
  generateInputHash,
  generateDeterministicFallbackBrief,
  getOrGenerateConnectionBrief,
} from "@/lib/ai/brief";

describe("AI Connection Briefs", () => {
  const sampleParams = {
    studentId: "student-1",
    alumId: "alum-1",
    intentId: "intent-1",
    offerId: "offer-1",
    studentGoal: "Prepare for PM interviews",
    helpTypeRequested: "Mock Interview",
    alumniName: "Priya Sharma",
    alumniRole: "Senior PM",
    alumniCompany: "Stripe",
    alumniDomains: ["Product Management", "FinTech"],
    offerTitle: "Mock Product Sense Practice",
  };

  it("generates deterministic and stable input hash", () => {
    const hash1 = generateInputHash(sampleParams);
    const hash2 = generateInputHash(sampleParams);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  it("hash changes when input data changes (cache invalidation)", () => {
    const hashOriginal = generateInputHash(sampleParams);
    const hashModified = generateInputHash({
      ...sampleParams,
      studentGoal: "Prepare for Software Engineering interviews",
    });
    expect(hashOriginal).not.toBe(hashModified);
  });

  it("deterministic fallback brief produces well-grounded text with no hallucination", () => {
    const fallback = generateDeterministicFallbackBrief(sampleParams);
    expect(fallback).toContain("Priya Sharma");
    expect(fallback).toContain("Senior PM at Stripe");
    expect(fallback).toContain("Product Management");
    expect(fallback).toContain("mock interview");
    expect(fallback).toContain("Prepare for PM interviews");
  });

  it("safely falls back without throwing when OPENAI_API_KEY is unset", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await getOrGenerateConnectionBrief(sampleParams);
    expect(result.isAiGenerated).toBe(false);
    expect(result.brief).toBeTruthy();
    expect(result.brief).toContain("Priya Sharma");

    process.env.OPENAI_API_KEY = originalKey;
  });
});
