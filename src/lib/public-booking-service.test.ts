import { describe, expect, it } from "vitest";

import {
  tooManyPublicBookings,
  validatePublicBookingInput,
} from "./public-booking-service";

describe("public booking validation", () => {
  it("requires a name and a contact method", () => {
    expect(
      validatePublicBookingInput({
        name: "",
        phone: "050",
        email: "",
        website: "",
        vacancyEventId: "v1",
      }).ok
    ).toBe(false);

    expect(
      validatePublicBookingInput({
        name: "Ada Lovelace",
        phone: "",
        email: "",
        website: "",
        vacancyEventId: "v1",
      })
    ).toMatchObject({ ok: false, error: "contact" });
  });

  it("treats a filled honeypot as a silent success", () => {
    expect(
      validatePublicBookingInput({
        name: "Bot",
        phone: "050",
        email: "",
        website: "https://spam.test",
        vacancyEventId: "v1",
      })
    ).toEqual({ ok: true, honeypot: true });
  });

  it("rate-limits repeated token attempts in a one-minute window", () => {
    const token = `t-${Date.now()}`;
    const start = 1_000_000;
    for (let i = 0; i < 8; i += 1) {
      expect(tooManyPublicBookings(token, start + i)).toBe(false);
    }
    expect(tooManyPublicBookings(token, start + 9)).toBe(true);
  });
});
