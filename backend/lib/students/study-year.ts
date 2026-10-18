/**
 * Study Year Computation Utility for SyncTies Students
 * 
 * Determines whether a student is 1st, 2nd, 3rd, or 4th year based on
 * their expected graduation month and year relative to the current academic calendar.
 */

export interface StudyYearResult {
  studyYear: 1 | 2 | 3 | 4;
  label: string;
  badgeLabel: string;
  shortLabel: string;
  description: string;
}

export const GRADUATION_MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

export function getGraduationYearOptions(referenceDate: Date = new Date()): number[] {
  const currentYear = referenceDate.getFullYear();
  // Graduation years capped at 2030 (standard 4-year degree span; 2031 and 2032 removed)
  const years: number[] = [];
  const maxYear = 2030;
  for (let y = currentYear; y <= maxYear; y++) {
    years.push(y);
  }
  return years;
}

/**
 * Computes the academic study year (1, 2, 3, or 4) based on graduation month and year.
 * Standard undergraduate degree assumes a 4-year curriculum.
 *
 * Examples (assuming reference date Oct 2026):
 * - May 2027 (~7 months remaining): 4th Year (Final Year)
 * - May 2028 (~19 months remaining): 3rd Year (Pre-final Year)
 * - May 2029 (~31 months remaining): 2nd Year (Sophomore)
 * - May 2030+ (> 36 months remaining): 1st Year (Freshman)
 */
export function calculateStudyYear(
  gradMonth: number,
  gradYear: number,
  referenceDate: Date = new Date()
): StudyYearResult {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1; // 1-12

  // Total months remaining until expected graduation
  const monthsRemaining = (gradYear - currentYear) * 12 + (gradMonth - currentMonth);

  if (monthsRemaining <= 12) {
    return {
      studyYear: 4,
      label: "4th Year Student (Final Year)",
      badgeLabel: "4th Year",
      shortLabel: "4th Year",
      description: "Graduating within ~1 year · Active job & interview prep",
    };
  } else if (monthsRemaining <= 24) {
    return {
      studyYear: 3,
      label: "3rd Year Student (Pre-final Year)",
      badgeLabel: "3rd Year",
      shortLabel: "3rd Year",
      description: "Graduating in ~2 years · Internship & career exploration",
    };
  } else if (monthsRemaining <= 36) {
    return {
      studyYear: 2,
      label: "2nd Year Student (Sophomore)",
      badgeLabel: "2nd Year",
      shortLabel: "2nd Year",
      description: "Graduating in ~3 years · Skill roadmaps & domain foundation",
    };
  } else {
    return {
      studyYear: 1,
      label: "1st Year Student (Freshman)",
      badgeLabel: "1st Year",
      shortLabel: "1st Year",
      description: "Graduating in 4+ years · Early guidance & campus navigation",
    };
  }
}

/**
 * Returns a concise formatted label for a given numeric study year (e.g. "1st Year", "2nd Year", "3rd Year", "4th Year").
 */
export function getStudyYearLabel(year?: number | null): string {
  if (year === 1) return "1st Year";
  if (year === 2) return "2nd Year";
  if (year === 3) return "3rd Year";
  if (year === 4) return "4th Year";
  return "";
}
