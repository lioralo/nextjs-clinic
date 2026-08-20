import { prisma } from "./prisma";
import { revalidateClinic } from "./revalidate";
import {
  consumeRecoveryCode,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCodes,
  totpQrDataUrl,
  totpUri,
  verifyTotp,
} from "./totp";

export async function beginTotpSetup(userId: string, username: string) {
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret, totpEnabled: false, totpRecoveryHashes: null },
  });
  const uri = totpUri(username, secret);
  const qrDataUrl = await totpQrDataUrl(uri);
  revalidateClinic();
  return { ok: true as const, secret, uri, qrDataUrl };
}

export async function confirmTotpSetup(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.totpSecret) return { ok: false as const, error: "missing" };
  if (!verifyTotp(user.totpSecret, code)) {
    return { ok: false as const, error: "invalid" };
  }
  const codes = generateRecoveryCodes();
  await prisma.user.update({
    where: { id: userId },
    data: {
      totpEnabled: true,
      totpRecoveryHashes: await hashRecoveryCodes(codes),
    },
  });
  revalidateClinic();
  return { ok: true as const, codes };
}

export async function disableTotp(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: null, totpEnabled: false, totpRecoveryHashes: null },
  });
  revalidateClinic();
  return { ok: true as const };
}

export async function verifyUserSecondFactor(input: {
  totpEnabled: boolean;
  totpSecret: string | null;
  totpRecoveryHashes: string | null;
  otp: string;
  userId: string;
}) {
  if (!input.totpEnabled) return { ok: true as const };
  if (input.totpSecret && verifyTotp(input.totpSecret, input.otp)) {
    return { ok: true as const };
  }
  const consumed = await consumeRecoveryCode(input.totpRecoveryHashes, input.otp);
  if (!consumed.ok) return { ok: false as const };
  await prisma.user.update({
    where: { id: input.userId },
    data: { totpRecoveryHashes: consumed.remaining },
  });
  return { ok: true as const };
}
