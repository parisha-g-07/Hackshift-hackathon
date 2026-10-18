/**
 * Pure deterministic score calculation functions for SyncTies Matching Engine.
 * Formula v1: TotalScore = 0.40 * D + 0.30 * H + 0.20 * C + 0.10 * R
 */

export interface ScoreWeights {
  d: number;
  h: number;
  c: number;
  r: number;
}

/**
 * Named matching weights configuration v1.
 * Tuning guide:
 * - D (Domain overlap, Jaccard): Increase if students report domain mismatch.
 * - H (Help type compatibility): Increase if students report alumni are offering the wrong kind of assistance.
 * - C (Capacity availability): Increase during high-demand recruitment cycles to spread out student requests.
 * - R (Recent activity): Adjust halfLifeDays or weight if inactive alumni are crowding out new mentors.
 */
export const MATCHING_WEIGHTS_V1 = {
  version: "v1",
  name: "matching_weights_v1",
  weights: {
    d: 0.40, // 40% Domain Overlap (Jaccard similarity)
    h: 0.30, // 30% Help Type Compatibility
    c: 0.20, // 20% Available Capacity Ratio
    r: 0.10, // 10% Recent Activity
  },
  halfLifeDays: 14,
  formulaString: "0.40 * D + 0.30 * H + 0.20 * C + 0.10 * R",
} as const;

export const DEFAULT_WEIGHTS: ScoreWeights = MATCHING_WEIGHTS_V1.weights;

/**
 * Factor D: Jaccard Similarity of Canonical Domains
 * D = 100 * |S ∩ A| / |S ∪ A|
 * If either set is empty, returns 0.
 */
export function calculateDomainOverlap(
  studentDomains: string[],
  alumniDomains: string[]
): number {
  if (!studentDomains || !alumniDomains || studentDomains.length === 0 || alumniDomains.length === 0) {
    return 0;
  }

  const studentSet = new Set(studentDomains);
  const alumniSet = new Set(alumniDomains);

  let intersectionCount = 0;
  for (const item of studentSet) {
    if (alumniSet.has(item)) {
      intersectionCount++;
    }
  }

  if (intersectionCount === 0) {
    return 0;
  }

  const unionSet = new Set([...studentDomains, ...alumniDomains]);
  const score = (100 * intersectionCount) / unionSet.size;

  return Math.round(score * 100) / 100;
}

/**
 * Factor H: Help Type Compatibility Score (0 to 100)
 * Uses the highest compatibility score among the alumnus's active offered help types.
 */
export function calculateHelpTypeScore(
  requestedHelpTypeId: string,
  offeredHelpTypeIds: string[],
  compatibilityMap: Record<string, number>
): number {
  if (!requestedHelpTypeId || !offeredHelpTypeIds || offeredHelpTypeIds.length === 0) {
    return 0;
  }

  let maxScore = 0;
  for (const offeredId of offeredHelpTypeIds) {
    if (offeredId === requestedHelpTypeId) {
      return 100; // Exact match is always 100
    }
    const pairKey = `${requestedHelpTypeId}:${offeredId}`;
    const score = compatibilityMap[pairKey] ?? 0;
    if (score > maxScore) {
      maxScore = score;
    }
  }

  return Math.round(maxScore * 100) / 100;
}

/**
 * Factor C: Available Capacity Score (0 to 100)
 * Remaining = max(0, limit - allocated)
 * C = 100 * Remaining / limit
 */
export function calculateCapacityScore(limit: number, allocated: number): number {
  if (limit <= 0) return 0;
  const remaining = Math.max(0, limit - allocated);
  const score = (100 * remaining) / limit;
  return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}

/**
 * Factor R: Recent Activity Score with 14-day half-life decay (0 to 100)
 * R = 100 * 2 ^ (-age_days / 14)
 */
export function calculateRecentActivityScore(
  lastActiveAt: Date | string | null | undefined,
  now: Date = new Date()
): number {
  if (!lastActiveAt) return 0;

  const date = typeof lastActiveAt === "string" ? new Date(lastActiveAt) : lastActiveAt;
  if (isNaN(date.getTime())) return 0;

  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const ageDays = diffMs / (1000 * 60 * 60 * 24);

  const score = 100 * Math.pow(2, -ageDays / 14);
  return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}

/**
 * Calculate Weighted Total Match Score
 * TotalScore = w_d * D + w_h * H + w_c * C + w_r * R
 */
export function calculateTotalMatchScore(
  d: number,
  h: number,
  c: number,
  r: number,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  const total =
    weights.d * Math.max(0, Math.min(100, d)) +
    weights.h * Math.max(0, Math.min(100, h)) +
    weights.c * Math.max(0, Math.min(100, c)) +
    weights.r * Math.max(0, Math.min(100, r));

  return Math.round(total * 100) / 100;
}

/**
 * Deterministic Tie-breaking Comparator
 */
export function compareCandidates<
  T extends {
    total_score: number;
    h_score: number;
    c_score: number;
    last_active_at: string;
    alum_id: string;
  }
>(a: T, b: T): number {
  // 1. Total score descending
  if (b.total_score !== a.total_score) {
    return b.total_score - a.total_score;
  }
  // 2. Help-type score descending
  if (b.h_score !== a.h_score) {
    return b.h_score - a.h_score;
  }
  // 3. Capacity score descending
  if (b.c_score !== a.c_score) {
    return b.c_score - a.c_score;
  }
  // 4. Recent activity descending
  const dateA = new Date(a.last_active_at).getTime();
  const dateB = new Date(b.last_active_at).getTime();
  if (dateB !== dateA) {
    return dateB - dateA;
  }
  // 5. Stable ID ascending
  return a.alum_id.localeCompare(b.alum_id);
}
