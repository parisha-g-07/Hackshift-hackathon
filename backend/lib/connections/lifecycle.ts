import { RequestStatus, UserRole } from "@/types/database";

export interface AllowedTransition {
  allowed: boolean;
  error?: string;
}

/**
 * Validates request status transition based on actor role and current status.
 */
export function validateRequestTransition(
  currentStatus: RequestStatus,
  action: "accept" | "decline" | "defer" | "ignore" | "withdraw",
  actorRole: UserRole
): AllowedTransition {
  if (currentStatus === "accepted" || currentStatus === "declined" || currentStatus === "ignored") {
    return {
      allowed: false,
      error: `Request is already in terminal state "${currentStatus}"`,
    };
  }

  if (currentStatus === "withdrawn" || currentStatus === "expired") {
    return {
      allowed: false,
      error: `Request has ended as "${currentStatus}" and cannot be modified`,
    };
  }

  // Student actions
  if (action === "withdraw") {
    if (actorRole !== "student") {
      return { allowed: false, error: "Only the student can withdraw a request" };
    }
    if (currentStatus !== "pending") {
      return { allowed: false, error: "Only pending requests can be withdrawn" };
    }
    return { allowed: true };
  }

  // Alumni actions
  if (actorRole !== "alum") {
    return { allowed: false, error: "Only the target alumnus can review this request" };
  }

  if (action === "accept" || action === "decline" || action === "defer" || action === "ignore") {
    if (currentStatus === "pending" || currentStatus === "deferred") {
      return { allowed: true };
    }
    return { allowed: false, error: `Cannot ${action} a request in status "${currentStatus}"` };
  }

  return { allowed: false, error: "Invalid action" };
}

/**
 * Maps action to new request status
 */
export function actionToRequestStatus(
  action: "accept" | "decline" | "defer" | "ignore" | "withdraw"
): RequestStatus {
  switch (action) {
    case "accept":
      return "accepted";
    case "decline":
      return "declined";
    case "defer":
      return "deferred";
    case "ignore":
      return "ignored";
    case "withdraw":
      return "withdrawn";
  }
}
