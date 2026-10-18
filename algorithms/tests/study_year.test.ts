import { describe, it, expect } from "vitest";
import { calculateStudyYear, getStudyYearLabel, getGraduationYearOptions } from "@/lib/students/study-year";

describe("calculateStudyYear", () => {
  const refDate = new Date(2026, 9, 15); // October 15, 2026

  it("classifies ~7 months remaining as 4th Year (Final Year)", () => {
    const res = calculateStudyYear(5, 2027, refDate); // May 2027
    expect(res.studyYear).toBe(4);
    expect(res.badgeLabel).toBe("4th Year");
  });

  it("classifies ~19 months remaining as 3rd Year (Pre-final Year)", () => {
    const res = calculateStudyYear(5, 2028, refDate); // May 2028
    expect(res.studyYear).toBe(3);
    expect(res.badgeLabel).toBe("3rd Year");
  });

  it("classifies ~31 months remaining as 2nd Year (Sophomore)", () => {
    const res = calculateStudyYear(5, 2029, refDate); // May 2029
    expect(res.studyYear).toBe(2);
    expect(res.badgeLabel).toBe("2nd Year");
  });

  it("classifies > 36 months remaining as 1st Year (Freshman)", () => {
    const res = calculateStudyYear(5, 2030, refDate); // May 2030
    expect(res.studyYear).toBe(1);
    expect(res.badgeLabel).toBe("1st Year");
  });

  it("handles December graduation within 2 months as 4th Year", () => {
    const res = calculateStudyYear(12, 2026, refDate);
    expect(res.studyYear).toBe(4);
  });

  it("formats study year labels correctly", () => {
    expect(getStudyYearLabel(1)).toBe("1st Year");
    expect(getStudyYearLabel(2)).toBe("2nd Year");
    expect(getStudyYearLabel(3)).toBe("3rd Year");
    expect(getStudyYearLabel(4)).toBe("4th Year");
    expect(getStudyYearLabel(null)).toBe("");
  });

  it("caps graduation years at 2030 and strictly excludes 2031 and 2032", () => {
    const years = getGraduationYearOptions(refDate);
    expect(years).toContain(2030);
    expect(years).not.toContain(2031);
    expect(years).not.toContain(2032);
    expect(Math.max(...years)).toBe(2030);
  });
});
