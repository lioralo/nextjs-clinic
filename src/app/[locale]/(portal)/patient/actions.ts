"use server";

import { redirect } from "next/navigation";

import { normalizeLocale } from "@/lib/locale";
import { changePortalPassword } from "@/lib/portal-service";
import {
  markNotificationsRead,
  sendMessage,
} from "@/lib/messaging-service";
import { getPrimaryStaffUser } from "@/lib/messaging-service";
import { revalidateClinic } from "@/lib/revalidate";
import { getSessionUser } from "@/lib/session";

export async function changePasswordAction(locale: string, formData: FormData) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT") redirect(`/${loc}/login`);
  const result = await changePortalPassword(
    user.id,
    String(formData.get("password") ?? "")
  );
  if (!result.ok) redirect(`/${loc}/patient/change-password?error=weak`);
  redirect(`/${loc}/patient`);
}

export async function sendPatientMessageAction(
  locale: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT") redirect(`/${loc}/login`);
  const staff = await getPrimaryStaffUser();
  if (staff) {
    await sendMessage({
      senderId: user.id,
      recipientId: staff.id,
      body: String(formData.get("body") ?? ""),
    });
  }
  revalidateClinic(user.patientId ?? undefined);
  redirect(`/${loc}/patient`);
}

export async function markPortalNotificationsReadAction(locale: string) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role !== "PATIENT") redirect(`/${loc}/login`);
  await markNotificationsRead(user.id);
  revalidateClinic();
  redirect(`/${loc}/patient`);
}
