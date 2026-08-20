import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateTime,
  parseDateInput,
  snapToClinicHours,
  startOfWeek,
  toDatetimeLocalValue,
  nextDateTimeOnWeekday,
} from "./datetime";

describe("datetime helpers", () => {
  it("formats a local datetime-local value", () => {
    const d = new Date(2026, 7, 19, 9, 30);
    expect(toDatetimeLocalValue(d)).toBe("2026-08-19T09:30");
  });

  it("formats Israeli dates as day-month-year without AM/PM", () => {
    const d = new Date(2026, 7, 19, 14, 5);
    expect(formatDate(d, "he")).toMatch(/19/);
    expect(formatDate(d, "he")).toMatch(/08|8/);
    expect(formatDate(d, "he")).toContain("2026");
    expect(formatDateTime(d, "he")).toMatch(/14/);
    expect(formatDateTime(d, "he")).not.toMatch(/AM|PM/i);
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

  it("snapToClinicHours stays inside 08:00–19:30", () => {
    const { start, end } = snapToClinicHours(new Date(2026, 7, 19, 21, 40), 60);
    expect(start.getHours()).toBe(8);
    expect(start.getDate()).toBe(20);
    expect(end.getTime() - start.getTime()).toBe(60 * 60 * 1000);
  });

  it("nextDateTimeOnWeekday skips the past", () => {
    const from = new Date(2026, 7, 19, 12, 0);
    const nextWed = nextDateTimeOnWeekday(3, 10, 0, from);
    expect(nextWed.getDay()).toBe(3);
    expect(nextWed.getDate()).toBe(26);
    expect(nextWed.getHours()).toBe(10);
  });
});
