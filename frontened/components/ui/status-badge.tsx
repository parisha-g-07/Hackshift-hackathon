import React from "react";
import { Badge } from "./badge";

export type RequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "deferred"
  | "ignored"
  | "withdrawn"
  | "expired";

export type GoalStatus = "open" | "in_progress" | "fulfilled" | "closed";

export function RequestStatusBadge({ status }: { status: RequestStatus | string }) {
  switch (status) {
    case "pending":
      return <Badge variant="warning">Pending Review</Badge>;
    case "accepted":
      return <Badge variant="success">Accepted</Badge>;
    case "declined":
      return <Badge variant="danger">Declined</Badge>;
    case "deferred":
      return <Badge variant="secondary">Deferred</Badge>;
    case "ignored":
      return <Badge variant="secondary">Ignored</Badge>;
    case "withdrawn":
      return <Badge variant="outline">Withdrawn</Badge>;
    case "expired":
      return <Badge variant="outline">Expired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function GoalStatusBadge({ status }: { status: GoalStatus | string }) {
  switch (status) {
    case "open":
      return <Badge variant="default">Open</Badge>;
    case "in_progress":
      return <Badge variant="indigo">In Progress</Badge>;
    case "fulfilled":
      return <Badge variant="success">Fulfilled</Badge>;
    case "closed":
      return <Badge variant="outline">Closed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
