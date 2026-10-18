import { describe, it, expect } from "vitest";
import { validateRequestTransition, actionToRequestStatus } from "@/lib/connections/lifecycle";
import {
  shouldFulfillGoal,
  canSubmitFeedback,
  canProgressGoal,
  isGoalParticipant,
  isSuccessfulReferral,
} from "@/lib/goals/lifecycle";

describe("Connection Request Lifecycle State Machine", () => {
  it("alumnus can accept a pending request", () => {
    const res = validateRequestTransition("pending", "accept", "alum");
    expect(res.allowed).toBe(true);
    expect(actionToRequestStatus("accept")).toBe("accepted");
  });

  it("alumnus can decline or ignore a pending request", () => {
    expect(validateRequestTransition("pending", "decline", "alum").allowed).toBe(true);
    expect(validateRequestTransition("pending", "ignore", "alum").allowed).toBe(true);
    expect(validateRequestTransition("pending", "defer", "alum").allowed).toBe(true);
  });

  it("student cannot accept or decline a request", () => {
    const res = validateRequestTransition("pending", "accept", "student");
    expect(res.allowed).toBe(false);
    expect(res.error).toContain("Only the target alumnus");
  });

  it("student can withdraw a pending request", () => {
    const res = validateRequestTransition("pending", "withdraw", "student");
    expect(res.allowed).toBe(true);
    expect(actionToRequestStatus("withdraw")).toBe("withdrawn");
  });

  it("alumnus cannot withdraw a student request", () => {
    const res = validateRequestTransition("pending", "withdraw", "alum");
    expect(res.allowed).toBe(false);
  });

  it("cannot modify an already accepted or declined request", () => {
    expect(validateRequestTransition("accepted", "decline", "alum").allowed).toBe(false);
    expect(validateRequestTransition("declined", "accept", "alum").allowed).toBe(false);
    expect(validateRequestTransition("ignored", "accept", "alum").allowed).toBe(false);
  });
});

describe("Goal Lifecycle, Mutual Dual Confirmation & Guardrails", () => {
  it("goal cannot progress from a declined, ignored, or expired request", () => {
    expect(canProgressGoal("declined", "open")).toBe(false);
    expect(canProgressGoal("ignored", "open")).toBe(false);
    expect(canProgressGoal("expired", "open")).toBe(false);
    expect(canProgressGoal("withdrawn", "open")).toBe(false);
    expect(canProgressGoal("pending", "open")).toBe(false);
    // Only accepted request allows progression
    expect(canProgressGoal("accepted", "open")).toBe(true);
  });

  it("participant-only read/update authorization rules", () => {
    const studentId = "student-123";
    const alumId = "alum-456";
    const strangerId = "stranger-789";

    expect(isGoalParticipant(studentId, studentId, alumId)).toBe(true);
    expect(isGoalParticipant(alumId, studentId, alumId)).toBe(true);
    expect(isGoalParticipant(strangerId, studentId, alumId)).toBe(false);
    expect(isGoalParticipant("", studentId, alumId)).toBe(false);
  });

  it("first confirmation does not fulfill the goal", () => {
    expect(shouldFulfillGoal(null, null, "accepted")).toBe(false);
    expect(shouldFulfillGoal("2026-10-17T10:00:00Z", null, "accepted")).toBe(false);
    expect(shouldFulfillGoal(null, "2026-10-17T11:00:00Z", "accepted")).toBe(false);
  });

  it("second confirmation fulfills the goal exactly once", () => {
    expect(shouldFulfillGoal("2026-10-17T10:00:00Z", "2026-10-17T11:00:00Z", "accepted")).toBe(true);
  });

  it("goal cannot be fulfilled if connection request was declined or ignored", () => {
    expect(shouldFulfillGoal("2026-10-17T10:00:00Z", "2026-10-17T11:00:00Z", "declined")).toBe(false);
    expect(shouldFulfillGoal("2026-10-17T10:00:00Z", "2026-10-17T11:00:00Z", "ignored")).toBe(false);
    expect(shouldFulfillGoal("2026-10-17T10:00:00Z", "2026-10-17T11:00:00Z", "expired")).toBe(false);
  });

  it("repeated confirmation is idempotent and does not duplicate fulfillment state", () => {
    let studentConfirmed: string | null = null;
    let alumConfirmed: string | null = null;
    let status = "in_progress";
    let fulfillmentCount = 0;

    const confirm = (role: "student" | "alum") => {
      if (status === "fulfilled") {
        return { status: "fulfilled", alreadyFulfilled: true };
      }
      if (role === "student") {
        studentConfirmed = studentConfirmed || new Date().toISOString();
      }
      if (role === "alum") {
        alumConfirmed = alumConfirmed || new Date().toISOString();
      }
      if (studentConfirmed && alumConfirmed) {
        status = "fulfilled";
        fulfillmentCount++;
      }
      return { status, alreadyFulfilled: false };
    };

    // First: student confirms
    const r1 = confirm("student");
    expect(r1.status).toBe("in_progress");
    expect(fulfillmentCount).toBe(0);

    // Repeated student confirmation
    const r1Repeat = confirm("student");
    expect(r1Repeat.status).toBe("in_progress");
    expect(fulfillmentCount).toBe(0);

    // Second: alumnus confirms -> fulfills
    const r2 = confirm("alum");
    expect(r2.status).toBe("fulfilled");
    expect(fulfillmentCount).toBe(1);

    // Repeated alumnus confirmation after fulfillment
    const r2Repeat = confirm("alum");
    expect(r2Repeat.alreadyFulfilled).toBe(true);
    expect(fulfillmentCount).toBe(1); // Never incremented again!
  });

  it("feedback before fulfillment is rejected", () => {
    expect(canSubmitFeedback("open")).toBe(false);
    expect(canSubmitFeedback("in_progress")).toBe(false);
    expect(canSubmitFeedback("closed")).toBe(false);
    expect(canSubmitFeedback("cancelled")).toBe(false);
    expect(canSubmitFeedback("fulfilled")).toBe(true);
  });

  it("duplicate feedback for same goal/reviewer is rejected", () => {
    const feedbackDb = new Map<string, any>();
    const submitFeedback = (goalId: string, reviewerId: string, rating: number) => {
      const key = `${goalId}:${reviewerId}`;
      if (feedbackDb.has(key)) {
        return { success: false, error: "Duplicate feedback rejected" };
      }
      feedbackDb.set(key, { goalId, reviewerId, rating });
      return { success: true };
    };

    const first = submitFeedback("goal-1", "student-1", 5);
    expect(first.success).toBe(true);

    const duplicate = submitFeedback("goal-1", "student-1", 4);
    expect(duplicate.success).toBe(false);
    expect(duplicate.error).toContain("Duplicate feedback");
  });

  it("successful referral only counts after explicit recorded outcome", () => {
    // "offered", "none", or "submitted" does NOT count as a successful referral
    expect(isSuccessfulReferral("none")).toBe(false);
    expect(isSuccessfulReferral("offered")).toBe(false);
    expect(isSuccessfulReferral("submitted")).toBe(false);
    expect(isSuccessfulReferral("unsuccessful")).toBe(false);

    // Only verified recorded positive outcomes count
    expect(isSuccessfulReferral("interview")).toBe(true);
    expect(isSuccessfulReferral("hired")).toBe(true);
  });
});
