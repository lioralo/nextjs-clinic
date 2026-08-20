import { describe, expect, it } from "vitest";

import { sendMail, smtpConfigured } from "./mail";

describe("mail helper", () => {
  it("skips sending when SMTP is not configured", async () => {
    expect(smtpConfigured()).toBe(false);
    await expect(
      sendMail({
        to: "ada@example.com",
        subject: "Hello",
        text: "Body",
      })
    ).resolves.toEqual({ ok: true, skipped: true });
  });

  it("rejects an empty recipient list", async () => {
    await expect(
      sendMail({ to: ["  "], subject: "x", text: "y" })
    ).resolves.toEqual({ ok: false, error: "no-recipient" });
  });
});
