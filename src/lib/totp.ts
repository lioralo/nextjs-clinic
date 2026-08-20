import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "Clinic";

export function generateTotpSecret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function totpUri(username: string, secret: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: username,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  }).toString();
}

export async function totpQrDataUrl(uri: string) {
  return QRCode.toDataURL(uri, { margin: 1, width: 180 });
}

export function verifyTotp(secret: string, code: string) {
  const token = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(token)) return false;
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.validate({ token, window: 1 }) !== null;
}

export function generateRecoveryCodes(count = 5) {
  return Array.from({ length: count }, () => randomBytes(4).toString("hex"));
}

export async function hashRecoveryCodes(codes: string[]) {
  const hashes = await Promise.all(codes.map((code) => bcrypt.hash(code, 12)));
  return JSON.stringify(hashes);
}

export function parseRecoveryHashes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function consumeRecoveryCode(
  hashesJson: string | null | undefined,
  candidate: string
): Promise<{ ok: true; remaining: string } | { ok: false }> {
  const hashes = parseRecoveryHashes(hashesJson);
  const code = candidate.trim().toLowerCase();
  for (let index = 0; index < hashes.length; index += 1) {
    const match = await bcrypt.compare(code, hashes[index]);
    if (match) {
      const remaining = hashes.filter((_, i) => i !== index);
      return { ok: true, remaining: JSON.stringify(remaining) };
    }
  }
  return { ok: false };
}
