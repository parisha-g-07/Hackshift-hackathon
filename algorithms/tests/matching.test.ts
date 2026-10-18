import { describe, it, expect } from "vitest";
import {
  calculateDomainOverlap,
  calculateHelpTypeScore,
  calculateCapacityScore,
  calculateRecentActivityScore,
  calculateTotalMatchScore,
  compareCandidates,
} from "@/lib/matching/score";

describe("Matching Engine Factor D: Domain Overlap (Jaccard)", () => {
  it("identical domain sets score 100", () => {
    const s = ["cs", "ai", "web"];
    const a = ["cs", "ai", "web"];
    expect(calculateDomainOverlap(s, a)).toBe(100);
  });

  it("partial overlap computes correct Jaccard ratio: 2/3 = 66.67", () => {
    const s = ["pm", "tech", "startups"];
    const a = ["pm", "tech"];
    // intersection = 2 (pm, tech), union = 3 (pm, tech, startups) => 2/3 = 66.67
    expect(calculateDomainOverlap(s, a)).toBe(66.67);
  });

  it("single domain overlap in larger set computes accurately: 1/4 = 25", () => {
    const s = ["pm", "tech"];
    const a = ["pm", "finance", "design"];
    // intersection = 1 (pm), union = 4 (pm, tech, finance, design) => 25%
    expect(calculateDomainOverlap(s, a)).toBe(25);
  });

  it("disjoint domain sets return 0 without error", () => {
    const s = ["healthcare", "biology"];
    const a = ["finance", "crypto"];
    expect(calculateDomainOverlap(s, a)).toBe(0);
  });

  it("empty student or alumni domain sets return 0 safely", () => {
    expect(calculateDomainOverlap([], ["cs"])).toBe(0);
    expect(calculateDomainOverlap(["cs"], [])).toBe(0);
    expect(calculateDomainOverlap([], [])).toBe(0);
  });
});

describe("Matching Engine Factor H: Help-Type Compatibility", () => {
  const compatibilityMap: Record<string, number> = {
    "mock-interview:career-guidance": 70,
    "resume-review:career-guidance": 70,
    "referral:mock-interview": 40,
    "referral:resume-review": 40,
  };

  it("exact match returns 100", () => {
    const score = calculateHelpTypeScore("mock-interview", ["mock-interview"], compatibilityMap);
    expect(score).toBe(100);
  });

  it("exact match ranks above approved related type (70)", () => {
    const exactScore = calculateHelpTypeScore("mock-interview", ["mock-interview"], compatibilityMap);
    const relatedScore = calculateHelpTypeScore("mock-interview", ["career-guidance"], compatibilityMap);
    expect(exactScore).toBe(100);
    expect(relatedScore).toBe(70);
    expect(exactScore).toBeGreaterThan(relatedScore);
  });

  it("returns highest score among multiple offered help types", () => {
    const score = calculateHelpTypeScore(
      "referral",
      ["career-guidance", "resume-review"],
      compatibilityMap
    );
    // resume-review has 40, career-guidance has 0 -> max is 40
    expect(score).toBe(40);
  });

  it("unsupported help type returns 0", () => {
    const score = calculateHelpTypeScore("higher-ed", ["mock-interview"], compatibilityMap);
    expect(score).toBe(0);
  });
});

describe("Matching Engine Factor C: Available Capacity", () => {
  it("full capacity (0 allocated) returns 100", () => {
    expect(calculateCapacityScore(5, 0)).toBe(100);
  });

  it("half capacity returns 50", () => {
    expect(calculateCapacityScore(4, 2)).toBe(50);
  });

  it("zero remaining capacity returns 0", () => {
    expect(calculateCapacityScore(3, 3)).toBe(0);
  });

  it("over-allocated capacity is clamped to 0", () => {
    expect(calculateCapacityScore(3, 5)).toBe(0);
  });

  it("invalid limit <= 0 returns 0", () => {
    expect(calculateCapacityScore(0, 0)).toBe(0);
    expect(calculateCapacityScore(-1, 0)).toBe(0);
  });
});

describe("Matching Engine Factor R: Recent Activity 14-Day Half-Life", () => {
  const now = new Date("2026-10-17T12:00:00Z");

  it("active today scores close to 100", () => {
    const activeToday = new Date("2026-10-17T10:00:00Z");
    const score = calculateRecentActivityScore(activeToday, now);
    expect(score).toBeGreaterThan(99);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("active 14 days ago scores exactly 50", () => {
    const active14DaysAgo = new Date("2026-10-03T12:00:00Z");
    const score = calculateRecentActivityScore(active14DaysAgo, now);
    expect(score).toBeCloseTo(50, 0);
  });

  it("active 28 days ago scores exactly 25", () => {
    const active28DaysAgo = new Date("2026-09-19T12:00:00Z");
    const score = calculateRecentActivityScore(active28DaysAgo, now);
    expect(score).toBeCloseTo(25, 0);
  });

  it("missing timestamp safely returns 0", () => {
    expect(calculateRecentActivityScore(null, now)).toBe(0);
    expect(calculateRecentActivityScore(undefined, now)).toBe(0);
    expect(calculateRecentActivityScore("invalid-date", now)).toBe(0);
  });
});

describe("Weighted Total Match Score & Tie-breaking", () => {
  it("matches specification worked example: D=80, H=100, C=50, R=75 => 79.5", () => {
    // 0.40(80) + 0.30(100) + 0.20(50) + 0.10(75) = 32 + 30 + 10 + 7.5 = 79.5
    const total = calculateTotalMatchScore(80, 100, 50, 75);
    expect(total).toBe(79.5);
  });

  it("score always stays in [0, 100]", () => {
    expect(calculateTotalMatchScore(100, 100, 100, 100)).toBe(100);
    expect(calculateTotalMatchScore(0, 0, 0, 0)).toBe(0);
    expect(calculateTotalMatchScore(-10, -50, 0, 0)).toBe(0);
    expect(calculateTotalMatchScore(150, 200, 100, 100)).toBe(100);
  });

  it("tie-breaks stably by total_score > h_score > c_score > recency > id", () => {
    const c1 = {
      alum_id: "user-b",
      total_score: 80,
      h_score: 100,
      c_score: 50,
      last_active_at: "2026-10-17T00:00:00Z",
    };
    const c2 = {
      alum_id: "user-a",
      total_score: 80,
      h_score: 100,
      c_score: 50,
      last_active_at: "2026-10-17T00:00:00Z",
    };

    const candidates = [c1, c2];
    candidates.sort(compareCandidates);

    // Everything is tied except alum_id -> user-a must come first (alphabetical)
    expect(candidates[0].alum_id).toBe("user-a");
    expect(candidates[1].alum_id).toBe("user-b");
  });
});
