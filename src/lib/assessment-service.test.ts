import { describe, expect, it } from "vitest";

import { scoreAnswers } from "./assessment-catalog";

describe("assessment scoring", () => {
  it("sums PHQ-9 answers into moderately severe", () => {
    const scored = scoreAnswers("PHQ-9", [2, 2, 2, 2, 2, 1, 1, 1, 1]);
    expect(scored).toMatchObject({
      ok: true,
      totalScore: 14,
      severityLevel: "moderate",
    });
  });

  it("rejects a short answer list", () => {
    expect(scoreAnswers("GAD-7", [0, 1])).toEqual({ ok: false, error: "answers" });
  });
});

describe("isStaffRole", () => {
  it("accepts clinic roles only", async () => {
    const { isStaffRole } = await import("./session");
    expect(isStaffRole("ADMIN")).toBe(true);
    expect(isStaffRole("CLINICIAN")).toBe(true);
    expect(isStaffRole("PATIENT")).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });
});
