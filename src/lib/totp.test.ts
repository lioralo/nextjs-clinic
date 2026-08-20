import { describe, expect, it } from "vitest";

import {
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCodes,
  consumeRecoveryCode,
  totpUri,
  verifyTotp,
} from "./totp";
import * as OTPAuth from "otpauth";

describe("totp helper", () => {
  it("verifies a current TOTP code", () => {
    const secret = generateTotpSecret();
    const token = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      digits: 6,
      period: 30,
    }).generate();
    expect(verifyTotp(secret, token)).toBe(true);
    expect(verifyTotp(secret, "000000")).toBe(false);
  });

  it("builds an otpauth URI", () => {
    const uri = totpUri("admin", generateTotpSecret());
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("Clinic");
  });

  it("consumes a matching recovery code once", async () => {
    const codes = generateRecoveryCodes(2);
    const hashes = await hashRecoveryCodes(codes);
    const first = await consumeRecoveryCode(hashes, codes[0]);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = await consumeRecoveryCode(first.remaining, codes[0]);
    expect(second.ok).toBe(false);
  });
});
