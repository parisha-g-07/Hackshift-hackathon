import { describe, it, expect } from "vitest";
import { getMentorTier, getMentorBadges } from "@/lib/mentors/tiers";

describe("Mentor Tier & Badge System", () => {
  describe("getMentorTier", () => {
    it("assigns Tier 1 (Mentor) for 0 to 99 mentees", () => {
      const tier0 = getMentorTier(0);
      expect(tier0.tierNumber).toBe(1);
      expect(tier0.label).toBe("Mentor");
      expect(tier0.nextTierLabel).toBe("Senior Mentor");
      expect(tier0.nextThreshold).toBe(100);
      expect(tier0.progressPercent).toBe(0);
      expect(tier0.menteesNeeded).toBe(100);

      const tier45 = getMentorTier(45);
      expect(tier45.tierNumber).toBe(1);
      expect(tier45.label).toBe("Mentor");
      expect(tier45.progressPercent).toBe(45);
      expect(tier45.menteesNeeded).toBe(55);

      const tier99 = getMentorTier(99);
      expect(tier99.tierNumber).toBe(1);
      expect(tier99.label).toBe("Mentor");
      expect(tier99.progressPercent).toBe(99);
      expect(tier99.menteesNeeded).toBe(1);
    });

    it("assigns Tier 2 (Senior Mentor) for 100 to 199 mentees", () => {
      const tier100 = getMentorTier(100);
      expect(tier100.tierNumber).toBe(2);
      expect(tier100.label).toBe("Senior Mentor");
      expect(tier100.nextTierLabel).toBe("Top-Tier Mentor");
      expect(tier100.nextThreshold).toBe(200);
      expect(tier100.progressPercent).toBe(0);
      expect(tier100.menteesNeeded).toBe(100);

      const tier150 = getMentorTier(150);
      expect(tier150.tierNumber).toBe(2);
      expect(tier150.progressPercent).toBe(50);
      expect(tier150.menteesNeeded).toBe(50);
    });

    it("assigns Tier 3 (Top-Tier Mentor) for 200 to 299 mentees", () => {
      const tier200 = getMentorTier(200);
      expect(tier200.tierNumber).toBe(3);
      expect(tier200.label).toBe("Top-Tier Mentor");
      expect(tier200.nextTierLabel).toBe("Distinguished Mentor");
      expect(tier200.nextThreshold).toBe(300);
      expect(tier200.progressPercent).toBe(0);
      expect(tier200.menteesNeeded).toBe(100);
    });

    it("assigns Tier 4 (Distinguished Mentor) for 300 to 399 mentees", () => {
      const tier300 = getMentorTier(300);
      expect(tier300.tierNumber).toBe(4);
      expect(tier300.label).toBe("Distinguished Mentor");
      expect(tier300.nextTierLabel).toBe("Elite Mentor");
    });

    it("assigns Tier 5 (Elite Mentor) for 400 to 499 mentees", () => {
      const tier400 = getMentorTier(400);
      expect(tier400.tierNumber).toBe(5);
      expect(tier400.label).toBe("Elite Mentor");
      expect(tier400.nextTierLabel).toBe("Mentor Legend");
    });

    it("assigns Tier 6+ (Mentor Legend) for 500+ mentees", () => {
      const tier500 = getMentorTier(500);
      expect(tier500.tierNumber).toBe(6);
      expect(tier500.label).toBe("Mentor Legend");

      const tier650 = getMentorTier(650);
      expect(tier650.tierNumber).toBe(7);
      expect(tier650.label).toBe("Mentor Legend Tier 2");
      expect(tier650.progressPercent).toBe(50);
    });
  });

  describe("getMentorBadges", () => {
    it("returns correct badges based on stats", () => {
      const badges = getMentorBadges({
        distinctMentees: 5,
        completedGoals: 3,
        avgRating: 4.9,
        reviewCount: 3,
        confirmedHours: 12,
      });

      expect(badges.length).toBeGreaterThanOrEqual(4);
      const verified = badges.find((b) => b.id === "verified_alumnus");
      expect(verified?.earned).toBe(true);

      const finisher = badges.find((b) => b.id === "goal_finisher");
      expect(finisher?.earned).toBe(true);

      const rating = badges.find((b) => b.id === "five_star");
      expect(rating?.earned).toBe(true);

      const guide = badges.find((b) => b.id === "dedicated_guide");
      expect(guide?.earned).toBe(true);
    });

    it("locks unearned badges when criteria is not met", () => {
      const badges = getMentorBadges({
        distinctMentees: 0,
        completedGoals: 0,
        avgRating: 3.5,
        reviewCount: 0,
        confirmedHours: 2,
      });

      const finisher = badges.find((b) => b.id === "goal_finisher");
      expect(finisher?.earned).toBe(false);

      const rating = badges.find((b) => b.id === "five_star");
      expect(rating?.earned).toBe(false);

      const guide = badges.find((b) => b.id === "dedicated_guide");
      expect(guide?.earned).toBe(false);
    });
  });
});
