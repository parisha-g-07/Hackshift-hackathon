import { describe, it, expect, beforeEach } from "vitest";

interface StudentTokenAccount {
  userId: string;
  periodStart: string;
  granted: number;
  spent: number;
  ledger: { id: string; amount: number; reason: string; requestId?: string }[];
}

interface AlumniCapacityAccount {
  userId: string;
  periodStart: string;
  limit: number;
  reserved: number;
  processed: number;
}

class AtomicTransactionSimulator {
  private studentTokens: Map<string, StudentTokenAccount> = new Map();
  private alumniCapacity: Map<string, AlumniCapacityAccount> = new Map();
  private requests: Map<string, any> = new Map();
  private idempotencyKeys: Set<string> = new Set();

  initStudent(userId: string, tokens: number = 5) {
    this.studentTokens.set(userId, {
      userId,
      periodStart: "2026-10-01",
      granted: tokens,
      spent: 0,
      ledger: [
        {
          id: `grant-${userId}`,
          amount: tokens,
          reason: "Monthly token allowance",
        },
      ],
    });
  }

  initAlumnus(userId: string, limit: number = 3) {
    this.alumniCapacity.set(userId, {
      userId,
      periodStart: "2026-10-01",
      limit,
      reserved: 0,
      processed: 0,
    });
  }

  getStudentBalance(userId: string): number {
    const acc = this.studentTokens.get(userId);
    return acc ? acc.granted - acc.spent : 0;
  }

  getAlumniRemaining(userId: string): number {
    const cap = this.alumniCapacity.get(userId);
    return cap ? Math.max(0, cap.limit - (cap.reserved + cap.processed)) : 0;
  }

  /**
   * Simulates the PostgreSQL Atomic Transaction:
   * SELECT ... FOR UPDATE on token & capacity rows
   * Debits 1 token, reserves 1 slot, writes ledger, records request
   */
  async submitRequestAtomic(params: {
    studentId: string;
    alumId: string;
    intentId: string;
    message: string;
    repeatReason?: string;
    idempotencyKey?: string;
  }): Promise<{ success: boolean; error?: string; requestId?: string; duplicateKey?: string }> {
    // 1. Idempotency Check
    if (params.idempotencyKey) {
      if (this.idempotencyKeys.has(params.idempotencyKey)) {
        return { success: true, requestId: `existing-${params.idempotencyKey}` };
      }
    }

    // 2. Lock & check student tokens
    const student = this.studentTokens.get(params.studentId);
    if (!student || student.granted - student.spent <= 0) {
      return { success: false, error: "Insufficient monthly tokens" };
    }

    // 3. Lock & check alumni capacity
    const alum = this.alumniCapacity.get(params.alumId);
    if (!alum || alum.limit - (alum.reserved + alum.processed) <= 0) {
      return { success: false, error: "Alumnus review capacity exhausted" };
    }

    // 4. Duplicate pending check
    const duplicateKey = `${params.studentId}:${params.alumId}:${params.intentId}`;
    if (this.requests.has(duplicateKey)) {
      return { success: false, error: "Duplicate active request exists for this intent" };
    }

    // 5. Repeat contact check
    let isRepeat = false;
    for (const req of this.requests.values()) {
      if (req.studentId === params.studentId && req.alumId === params.alumId) {
        isRepeat = true;
        break;
      }
    }

    if (isRepeat && (!params.repeatReason || params.repeatReason.trim().length < 5)) {
      return { success: false, error: "Repeat contact requires an explicit justification" };
    }

    // 6. Execute atomic state changes
    student.spent += 1;
    alum.reserved += 1;

    const requestId = `req-${Date.now()}-${Math.random()}`;
    student.ledger.push({
      id: `spend-${requestId}`,
      amount: -1,
      reason: "Connection request",
      requestId,
    });

    this.requests.set(duplicateKey, {
      requestId,
      studentId: params.studentId,
      alumId: params.alumId,
      intentId: params.intentId,
      status: "pending",
      isRepeat,
    });

    if (params.idempotencyKey) {
      this.idempotencyKeys.add(params.idempotencyKey);
    }

    return { success: true, requestId, duplicateKey };
  }

  withdrawRequest(duplicateKey: string): { success: boolean; error?: string } {
    const req = this.requests.get(duplicateKey);
    if (!req) return { success: false, error: "Request not found" };
    if (req.status !== "pending") return { success: false, error: "Only pending requests can be withdrawn" };

    req.status = "withdrawn";

    // Release reserved capacity slot
    const alum = this.alumniCapacity.get(req.alumId);
    if (alum) {
      alum.reserved = Math.max(0, alum.reserved - 1);
    }

    // Refund student token and record ledger
    const student = this.studentTokens.get(req.studentId);
    if (student) {
      student.spent = Math.max(0, student.spent - 1);
      student.ledger.push({
        id: `refund-${req.requestId}`,
        amount: 1,
        reason: "Refund for withdrawn connection request",
        requestId: req.requestId,
      });
    }

    return { success: true };
  }

  respondRequest(duplicateKey: string, action: "accept" | "decline" | "ignore"): { success: boolean } {
    const req = this.requests.get(duplicateKey);
    if (!req) return { success: false };
    req.status = action === "accept" ? "accepted" : action === "decline" ? "declined" : "ignored";
    const alum = this.alumniCapacity.get(req.alumId);
    if (alum) {
      alum.reserved = Math.max(0, alum.reserved - 1);
      alum.processed += 1; // Processed requests remain counted for the month!
    }
    return { success: true };
  }
}

describe("Tokens & Capacity Concurrency and Invariants", () => {
  let sim: AtomicTransactionSimulator;

  beforeEach(() => {
    sim = new AtomicTransactionSimulator();
  });

  it("zero-token student request is rejected with zero side-effects", async () => {
    sim.initStudent("student-zero", 0);
    sim.initAlumnus("alum-1", 3);

    const res = await sim.submitRequestAtomic({
      studentId: "student-zero",
      alumId: "alum-1",
      intentId: "intent-1",
      message: "Please help me with interview prep",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Insufficient monthly tokens");
    expect(sim.getStudentBalance("student-zero")).toBe(0);
    expect(sim.getAlumniRemaining("alum-1")).toBe(3); // Unchanged!
  });

  it("successful request consumes exactly 1 token and reserves exactly 1 capacity slot", async () => {
    sim.initStudent("student-1", 5);
    sim.initAlumnus("alum-1", 3);

    const res = await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-1",
      message: "Looking for product management mock interview practice",
    });

    expect(res.success).toBe(true);
    expect(sim.getStudentBalance("student-1")).toBe(4); // 5 - 1 = 4
    expect(sim.getAlumniRemaining("alum-1")).toBe(2); // 3 - 1 = 2
  });

  it("two concurrent submissions for the last student token: only one can succeed", async () => {
    sim.initStudent("student-last-token", 1); // Exactly 1 token left
    sim.initAlumnus("alum-1", 5);
    sim.initAlumnus("alum-2", 5);

    // Simulate concurrent requests
    const p1 = sim.submitRequestAtomic({
      studentId: "student-last-token",
      alumId: "alum-1",
      intentId: "intent-a",
      message: "Request to alum 1",
    });

    const p2 = sim.submitRequestAtomic({
      studentId: "student-last-token",
      alumId: "alum-2",
      intentId: "intent-b",
      message: "Request to alum 2",
    });

    const [r1, r2] = await Promise.all([p1, p2]);

    const successes = [r1, r2].filter((r) => r.success);
    const failures = [r1, r2].filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].error).toContain("Insufficient monthly tokens");
    expect(sim.getStudentBalance("student-last-token")).toBe(0);
  });

  it("two concurrent submissions for the alumnus's final capacity slot: only one can reserve it", async () => {
    sim.initStudent("student-a", 5);
    sim.initStudent("student-b", 5);
    sim.initAlumnus("busy-alum", 1); // Exactly 1 slot left

    const p1 = sim.submitRequestAtomic({
      studentId: "student-a",
      alumId: "busy-alum",
      intentId: "intent-a",
      message: "Student A reaching out",
    });

    const p2 = sim.submitRequestAtomic({
      studentId: "student-b",
      alumId: "busy-alum",
      intentId: "intent-b",
      message: "Student B reaching out",
    });

    const [r1, r2] = await Promise.all([p1, p2]);

    const successes = [r1, r2].filter((r) => r.success);
    const failures = [r1, r2].filter((r) => !r.success);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect(failures[0].error).toContain("capacity exhausted");
    expect(sim.getAlumniRemaining("busy-alum")).toBe(0);
  });

  it("retrying the same idempotency key cannot double-charge", async () => {
    sim.initStudent("student-1", 5);
    sim.initAlumnus("alum-1", 3);

    const idempotencyKey = "req-uuid-12345";

    const first = await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-1",
      message: "First attempt",
      idempotencyKey,
    });

    const retry = await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-1",
      message: "Network retry attempt with same key",
      idempotencyKey,
    });

    expect(first.success).toBe(true);
    expect(retry.success).toBe(true);
    // Student debited exactly once
    expect(sim.getStudentBalance("student-1")).toBe(4);
    // Capacity reserved exactly once
    expect(sim.getAlumniRemaining("alum-1")).toBe(2);
  });

  it("duplicate pending request for the same pair/intent is rejected", async () => {
    sim.initStudent("student-1", 5);
    sim.initAlumnus("alum-1", 3);

    const first = await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-1",
      message: "First request",
    });
    expect(first.success).toBe(true);

    const duplicate = await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-1",
      message: "Duplicate request without closing first",
    });
    expect(duplicate.success).toBe(false);
    expect(duplicate.error).toContain("Duplicate active request exists");
  });

  it("repeat contact in month requires an explicit reason", async () => {
    sim.initStudent("student-1", 5);
    sim.initAlumnus("alum-1", 3);

    // Initial request for intent-1
    await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-1",
      message: "Initial request",
    });

    // Second request to same alum for intent-2 without reason -> fails
    const failRepeat = await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-2",
      message: "Second request to same alum",
      repeatReason: "",
    });
    expect(failRepeat.success).toBe(false);
    expect(failRepeat.error).toContain("Repeat contact requires an explicit justification");

    // Second request with valid reason -> succeeds
    const successRepeat = await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-2",
      message: "Second request to same alum with reason",
      repeatReason: "Following up on new resume revisions we discussed",
    });
    expect(successRepeat.success).toBe(true);
  });

  it("student withdrawal before review releases reserved capacity and refunds token", async () => {
    sim.initStudent("student-1", 5);
    sim.initAlumnus("alum-1", 3);

    const submission = await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-1",
      message: "Initial outreach message",
    });

    expect(submission.success).toBe(true);
    expect(sim.getStudentBalance("student-1")).toBe(4); // 5 - 1 = 4
    expect(sim.getAlumniRemaining("alum-1")).toBe(2); // 3 - 1 = 2

    // Student withdraws before alumnus reviews
    const withdraw = sim.withdrawRequest(submission.duplicateKey!);
    expect(withdraw.success).toBe(true);

    // Reserved capacity slot released
    expect(sim.getAlumniRemaining("alum-1")).toBe(3); // Restored to 3!
    // Student token refunded
    expect(sim.getStudentBalance("student-1")).toBe(5); // Restored to 5!
  });

  it("processed requests (accepted, declined, ignored) remain counted for the month and do not release capacity", async () => {
    sim.initStudent("student-1", 5);
    sim.initAlumnus("alum-1", 3);

    const submission = await sim.submitRequestAtomic({
      studentId: "student-1",
      alumId: "alum-1",
      intentId: "intent-1",
      message: "Outreach message",
    });

    expect(sim.getAlumniRemaining("alum-1")).toBe(2);

    // Alumnus declines the request
    const response = sim.respondRequest(submission.duplicateKey!, "decline");
    expect(response.success).toBe(true);

    // Capacity is NOT released: processed slots remain counted for the month!
    expect(sim.getAlumniRemaining("alum-1")).toBe(2); // Still 2, not 3!
  });
});
