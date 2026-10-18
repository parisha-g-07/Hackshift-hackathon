import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/store";
import { validateRequestTransition, actionToRequestStatus } from "@/lib/connections/lifecycle";
import { RequestStatus, UserRole } from "@/types/database";

export const dynamic = "force-dynamic";

const patchRequestSchema = z.object({
  action: z.enum(["accept", "decline", "defer", "ignore", "withdraw"]),
  response_note: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const body = await req.json();
    const { action, response_note } = patchRequestSchema.parse(body);

    if (isSupabaseConfigured()) {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: request, error: reqError } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (reqError || !request) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const userRole = (profile?.role as UserRole) || "student";
      const validation = validateRequestTransition(
        request.status as RequestStatus,
        action,
        userRole
      );

      if (!validation.allowed) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const newStatus = actionToRequestStatus(action);

      const { data: updated, error: updateError } = await supabase
        .from("connection_requests")
        .update({
          status: newStatus,
          alumni_response_note: response_note || null,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Update Goal status and Capacity/Tokens based on new status
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      if (newStatus === "accepted") {
        await supabase
          .from("goals")
          .update({ status: "in_progress", updated_at: new Date().toISOString() })
          .eq("request_id", requestId);

        // Move reserved slot to processed
        const { error: rpcErr } = await supabase.rpc("increment_alumni_processed_capacity", {
          p_alum_id: request.alum_id,
          p_period_start: currentMonth,
        });
        if (rpcErr) {
          // Direct fallback query if helper RPC not installed
          await supabase
            .from("alumni_capacity_monthly")
            .update({
              reserved_count: Math.max(0, (request.reserved_count || 1) - 1),
              processed_count: (request.processed_count || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", request.alum_id)
            .eq("period_start", currentMonth);
        }
      } else if (newStatus === "declined" || newStatus === "ignored") {
        await supabase
          .from("goals")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("request_id", requestId);

        // Processed requests remain counted for the month
        await supabase
          .from("alumni_capacity_monthly")
          .update({
            reserved_count: Math.max(0, (request.reserved_count || 1) - 1),
            processed_count: (request.processed_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", request.alum_id)
          .eq("period_start", currentMonth);
      } else if (newStatus === "withdrawn") {
        await supabase
          .from("goals")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("request_id", requestId);

        // Release reserved capacity slot back to alumnus
        await supabase
          .from("alumni_capacity_monthly")
          .update({
            reserved_count: Math.max(0, (request.reserved_count || 1) - 1),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", request.alum_id)
          .eq("period_start", currentMonth);

        // Refund token to student
        await supabase
          .from("student_monthly_tokens")
          .update({
            tokens_spent: Math.max(0, (request.tokens_spent || 1) - 1),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", request.student_id)
          .eq("period_start", currentMonth);

        // Record refund in token ledger
        await supabase.from("token_ledger").insert({
          user_id: request.student_id,
          period_start: currentMonth,
          entry_type: "refund",
          amount: 1,
          request_id: requestId,
          reason: "Refund for withdrawn connection request",
        });
      }

      return NextResponse.json({ request: updated });
    }

    // Standalone fallback
    const targetRequest = localStore.requests.find((r) => r.id === requestId);
    if (!targetRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const validation = validateRequestTransition(
      targetRequest.status,
      action,
      action === "withdraw" ? "student" : "alum"
    );

    if (!validation.allowed) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const newStatus = actionToRequestStatus(action);
    targetRequest.status = newStatus;
    targetRequest.alumni_response_note = response_note;
    targetRequest.responded_at = new Date().toISOString();
    targetRequest.updated_at = new Date().toISOString();

    const alumCap = localStore.capacities[targetRequest.alum_id];
    const studentTokens = localStore.studentTokens[targetRequest.student_id];
    const goal = localStore.goals.find((g) => g.request_id === requestId);

    if (newStatus === "accepted") {
      if (goal) {
        goal.status = "in_progress";
        goal.updated_at = new Date().toISOString();
      }
      if (alumCap) {
        alumCap.reserved_count = Math.max(0, alumCap.reserved_count - 1);
        alumCap.processed_count += 1;
        alumCap.remaining_capacity = Math.max(0, alumCap.monthly_limit - (alumCap.reserved_count + alumCap.processed_count));
      }
    } else if (newStatus === "declined" || newStatus === "ignored") {
      if (goal) {
        goal.status = "cancelled";
        goal.updated_at = new Date().toISOString();
      }
      if (alumCap) {
        alumCap.reserved_count = Math.max(0, alumCap.reserved_count - 1);
        alumCap.processed_count += 1;
        alumCap.remaining_capacity = Math.max(0, alumCap.monthly_limit - (alumCap.reserved_count + alumCap.processed_count));
      }
    } else if (newStatus === "withdrawn") {
      if (goal) {
        goal.status = "cancelled";
        goal.updated_at = new Date().toISOString();
      }
      if (alumCap) {
        // Release reserved capacity slot
        alumCap.reserved_count = Math.max(0, alumCap.reserved_count - 1);
        alumCap.remaining_capacity = Math.max(0, alumCap.monthly_limit - (alumCap.reserved_count + alumCap.processed_count));
      }
      if (studentTokens) {
        // Refund student token
        studentTokens.tokens_spent = Math.max(0, studentTokens.tokens_spent - 1);
        studentTokens.tokens_remaining = Math.min(studentTokens.tokens_granted, studentTokens.tokens_remaining + 1);
      }
    }

    return NextResponse.json({ request: targetRequest, isDemo: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const msg = err.issues?.[0]?.message || (err as any).errors?.[0]?.message || "Validation error";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
