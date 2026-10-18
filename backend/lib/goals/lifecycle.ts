import { GoalStatus } from "@/types/database";

/**
 * Validates whether a goal is allowed to progress into in_progress.
 * Prevent a declined/ignored/expired request from producing an in-progress or fulfilled goal.
 */
export function canProgressGoal(
  requestStatus: string,
  currentGoalStatus?: GoalStatus
): boolean {
  if (requestStatus !== "accepted") {
    return false;
  }
  if (currentGoalStatus === "cancelled" || currentGoalStatus === "closed") {
    return false;
  }
  return true;
}

/**
 * Checks whether the user is an authorized goal participant.
 */
export function isGoalParticipant(
  userId: string,
  studentId: string,
  alumId: string
): boolean {
  return Boolean(userId && (userId === studentId || userId === alumId));
}

/**
 * Mutual goal completion logic:
 * A goal is fulfilled if and only if BOTH student and alumnus have confirmed.
 */
export function shouldFulfillGoal(
  studentConfirmedAt: Date | string | null | undefined,
  alumConfirmedAt: Date | string | null | undefined,
  requestStatus: string = "accepted"
): boolean {
  if (requestStatus !== "accepted") {
    return false;
  }

  if (!studentConfirmedAt || !alumConfirmedAt) {
    return false;
  }

  const sDate = typeof studentConfirmedAt === "string" ? new Date(studentConfirmedAt) : studentConfirmedAt;
  const aDate = typeof alumConfirmedAt === "string" ? new Date(alumConfirmedAt) : alumConfirmedAt;

  return !isNaN(sDate.getTime()) && !isNaN(aDate.getTime());
}

/**
 * Checks if feedback submission is allowed.
 * Only allowed if the goal is mutually fulfilled.
 */
export function canSubmitFeedback(goalStatus: GoalStatus): boolean {
  return goalStatus === "fulfilled";
}

/**
 * Verifies whether a referral outcome counts as a verified successful referral.
 * Section B.9: "A referral only counts as successful if an outcome is actually recorded;
 * an offer to refer is not a successful referral."
 */
export function isSuccessfulReferral(referralStatus: string): boolean {
  // Only outcomes where an interview occurred or candidate was hired count as successful referrals
  return referralStatus === "interview" || referralStatus === "hired";
}
