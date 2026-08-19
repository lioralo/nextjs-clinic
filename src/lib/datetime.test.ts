import { describe, expect, it } from "vitest";

import { parseDateInput, startOfWeek, toDatetimeLocalValue } from "./datetime";

describe("datetime helpers", () => {
  it("formats a local datetime-local value", () => {
    const d = new Date(2026, 7, 19, 9, 30);
    expect(toDatetimeLocalValue(d)).toBe("2026-08-19T09:30");
  });

  it("parses a valid date string", () => {
    const parsed = parseDateInput("2026-08-19T09:30");
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getHours()).toBe(9);
    expect(parsed?.getMinutes()).toBe(30);
  });

  it("returns null for invalid input", () => {
    expect(parseDateInput("not-a-date")).toBeNull();
  });

  it("startOfWeek uses Sunday when firstDay is 0", () => {
    const wednesday = new Date(2026, 7, 19, 12, 0);
    const start = startOfWeek(wednesday, 0);
    expect(start.getDay()).toBe(0);
    expect(start.getDate()).toBe(16);
  });
});
