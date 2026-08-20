"use server";

import { redirect } from "next/navigation";

import { normalizeLocale } from "@/lib/locale";
import { getSessionUser } from "@/lib/session";
import {
  beginTotpSetup,
  confirmTotpSetup,
  disableTotp,
} from "@/lib/totp-service";

async function requireUser(locale: string) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user) redirect(`/${loc}/login`);
  return { loc, user };
}

export async function beginTotpSetupAction(locale: string) {
  const { user } = await requireUser(locale);
  return beginTotpSetup(user.id, user.username ?? "user");
}

export async function confirmTotpSetupAction(
  locale: string,
  formData: FormData
) {
  const { user } = await requireUser(locale);
  return confirmTotpSetup(user.id, String(formData.get("code") ?? ""));
}

export async function disableTotpAction(locale: string) {
  const { loc, user } = await requireUser(locale);
  await disableTotp(user.id);
  if (user.role === "PATIENT") redirect(`/${loc}/patient/security`);
  redirect(`/${loc}/settings`);
}
