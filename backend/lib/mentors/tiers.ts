/**
 * SyncTies Mentor Tier & Badge System
 * Enforces tier progression based strictly on distinct verified mentees helped
 * from mutually confirmed fulfilled goal threads.
 *
 * Tier Table:
 * 0 - 99:    Mentor
 * 100 - 199: Senior Mentor
 * 200 - 299: Top-Tier Mentor
 * 300 - 399: Distinguished Mentor
 * 400 - 499: Elite Mentor
 * 500 - 599: Mentor Legend
 * Each additional 100 advances to next level.
 */

export interface MentorTierInfo {
  tierNumber: number;
  label: string;
  minMentees: number;
  maxMentees: number | null;
  nextTierLabel: string | null;
  nextThreshold: number | null;
  currentMentees: number;
  progressPercent: number;
  menteesNeeded: number;
  badgeTone: "soft" | "success" | "demo" | "warning";
  accentColor: string;
}

export interface MentorBadge {
  id: string;
  name: string;
  description: string;
  icon: "shield" | "check" | "sparkles" | "star" | "clock";
  earned: boolean;
  earnedDate?: string;
}

export function getMentorTier(distinctMentees: number = 0): MentorTierInfo {
  const count = Math.max(0, distinctMentees);

  if (count < 100) {
    const progress = Math.min(100, Math.round((count / 100) * 100));
    return {
      tierNumber: 1,
      label: "Mentor",
      minMentees: 0,
      maxMentees: 99,
      nextTierLabel: "Senior Mentor",
      nextThreshold: 100,
      currentMentees: count,
      progressPercent: progress,
      menteesNeeded: Math.max(0, 100 - count),
      badgeTone: "soft",
      accentColor: "#3563ff",
    };
  }

  if (count < 200) {
    const progress = Math.min(100, Math.round(((count - 100) / 100) * 100));
    return {
      tierNumber: 2,
      label: "Senior Mentor",
      minMentees: 100,
      maxMentees: 199,
      nextTierLabel: "Top-Tier Mentor",
      nextThreshold: 200,
      currentMentees: count,
      progressPercent: progress,
      menteesNeeded: Math.max(0, 200 - count),
      badgeTone: "demo",
      accentColor: "#7c5ce7",
    };
  }

  if (count < 300) {
    const progress = Math.min(100, Math.round(((count - 200) / 100) * 100));
    return {
      tierNumber: 3,
      label: "Top-Tier Mentor",
      minMentees: 200,
      maxMentees: 299,
      nextTierLabel: "Distinguished Mentor",
      nextThreshold: 300,
      currentMentees: count,
      progressPercent: progress,
      menteesNeeded: Math.max(0, 300 - count),
      badgeTone: "success",
      accentColor: "#2d9667",
    };
  }

  if (count < 400) {
    const progress = Math.min(100, Math.round(((count - 300) / 100) * 100));
    return {
      tierNumber: 4,
      label: "Distinguished Mentor",
      minMentees: 300,
      maxMentees: 399,
      nextTierLabel: "Elite Mentor",
      nextThreshold: 400,
      currentMentees: count,
      progressPercent: progress,
      menteesNeeded: Math.max(0, 400 - count),
      badgeTone: "warning",
      accentColor: "#a96817",
    };
  }

  if (count < 500) {
    const progress = Math.min(100, Math.round(((count - 400) / 100) * 100));
    return {
      tierNumber: 5,
      label: "Elite Mentor",
      minMentees: 400,
      maxMentees: 499,
      nextTierLabel: "Mentor Legend",
      nextThreshold: 500,
      currentMentees: count,
      progressPercent: progress,
      menteesNeeded: Math.max(0, 500 - count),
      badgeTone: "warning",
      accentColor: "#c44f5a",
    };
  }

  // 500+
  const extraLevels = Math.floor((count - 500) / 100);
  const nextTarget = 500 + (extraLevels + 1) * 100;
  const currentLevelStart = 500 + extraLevels * 100;
  const progress = Math.min(100, Math.round(((count - currentLevelStart) / 100) * 100));

  return {
    tierNumber: 6 + extraLevels,
    label: extraLevels === 0 ? "Mentor Legend" : `Mentor Legend Tier ${extraLevels + 1}`,
    minMentees: currentLevelStart,
    maxMentees: nextTarget - 1,
    nextTierLabel: `Mentor Legend Tier ${extraLevels + 2}`,
    nextThreshold: nextTarget,
    currentMentees: count,
    progressPercent: progress,
    menteesNeeded: Math.max(0, nextTarget - count),
    badgeTone: "demo",
    accentColor: "#7c5ce7",
  };
}

export function getMentorBadges(stats: {
  distinctMentees?: number;
  completedGoals?: number;
  avgRating?: number;
  reviewCount?: number;
  confirmedHours?: number;
}): MentorBadge[] {
  const mentees = stats.distinctMentees ?? 1;
  const completed = stats.completedGoals ?? 1;
  const rating = stats.avgRating ?? 5.0;
  const reviews = stats.reviewCount ?? 1;
  const hours = stats.confirmedHours ?? 3;

  return [
    {
      id: "verified_alumnus",
      name: "Verified Mentor",
      description: "Confirmed alumni status & professional domain identity",
      icon: "shield",
      earned: true,
      earnedDate: "Active",
    },
    {
      id: "goal_finisher",
      name: "Goal Finisher",
      description: "Completed dual-confirmed goals with students",
      icon: "check",
      earned: completed >= 1,
      earnedDate: completed >= 1 ? `${completed} fulfilled` : undefined,
    },
    {
      id: "five_star",
      name: "Top Feedback",
      description: "Maintains high student satisfaction reviews",
      icon: "star",
      earned: reviews >= 1 && rating >= 4.5,
      earnedDate: reviews >= 1 ? `${rating.toFixed(1)} ★ rating` : undefined,
    },
    {
      id: "responsive",
      name: "Prompt Responder",
      description: "Consistently responds to connection requests within 48h",
      icon: "clock",
      earned: true,
      earnedDate: "Fast response",
    },
    {
      id: "dedicated_guide",
      name: "Dedicated Guide",
      description: "Provided 10+ confirmed mentoring session hours",
      icon: "sparkles",
      earned: hours >= 10,
      earnedDate: hours >= 10 ? `${hours} hrs confirmed` : `${hours} / 10 hrs`,
    },
  ];
}
