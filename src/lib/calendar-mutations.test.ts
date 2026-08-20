import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findConflict: vi.fn(),
  createAppointment: vi.fn(),
  ensurePublicBookingLink: vi.fn(),
  revalidateClinic: vi.fn(),
}));

vi.mock("@/lib/appointment-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./appointment-service")>();
  return {
    ...actual,
    findConflict: mocks.findConflict,
    createAppointment: mocks.createAppointment,
  };
});

vi.mock("@/lib/public-booking-service", () => ({
  ensurePublicBookingLink: mocks.ensurePublicBookingLink,
}));

vi.mock("@/lib/revalidate", () => ({
  revalidateClinic: mocks.revalidateClinic,
}));

import {
  publishPublicVacancies,
  weekdayVacancyWindows,
} from "./calendar-mutations";

describe("publish vacancy windows", () => {
  beforeEach(() => {
    mocks.findConflict.mockReset();
    mocks.createAppointment.mockReset();
    mocks.ensurePublicBookingLink.mockReset();
    mocks.revalidateClinic.mockReset();
  });

  it("builds one window per weekday and skips duplicates", () => {
    const from = new Date(2026, 7, 19, 8, 0);
    const windows = weekdayVacancyWindows([3, 3, 4], 10, 0, 60, from);
    expect(windows).toHaveLength(2);
    expect(windows[0].startAt.getDay()).toBe(3);
    expect(windows[0].endAt.getTime() - windows[0].startAt.getTime()).toBe(
      60 * 60 * 1000
    );
    expect(windows[1].startAt.getDay()).toBe(4);
  });

  it("skips conflicting weekdays and still returns a public token", async () => {
    mocks.findConflict
      .mockResolvedValueOnce({ id: "busy" })
      .mockResolvedValue(null);
    mocks.createAppointment.mockResolvedValue({ id: "vac-1" });
    mocks.ensurePublicBookingLink.mockResolvedValue({ token: "pub-token" });

    const result = await publishPublicVacancies("user-1", {
      weekdays: [3, 4],
      startTime: "10:00",
      isRecurring: false,
    });

    expect(result).toEqual({ ok: true, token: "pub-token" });
    expect(mocks.createAppointment).toHaveBeenCalledTimes(1);
  });

  it("mints a booking link without creating vacancies when no weekdays are chosen", async () => {
    mocks.ensurePublicBookingLink.mockResolvedValue({ token: "link-only" });

    const result = await publishPublicVacancies("user-1", {
      weekdays: [],
      startTime: "10:00",
    });

    expect(result).toEqual({ ok: true, token: "link-only" });
    expect(mocks.findConflict).not.toHaveBeenCalled();
    expect(mocks.createAppointment).not.toHaveBeenCalled();
  });
});
