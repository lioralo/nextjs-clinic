"use server";

import { redirect } from "next/navigation";

import { normalizeLocale } from "@/lib/locale";
import {
  broadcastNotification,
  sendMessage,
} from "@/lib/messaging-service";
import { getSessionUser } from "@/lib/session";
import { revalidateClinic } from "@/lib/revalidate";

export async function sendStaffMessageAction(
  locale: string,
  recipientId: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  await sendMessage({
    senderId: user.id,
    recipientId,
    body: String(formData.get("body") ?? ""),
  });
  revalidateClinic();
  redirect(`/${loc}/messages?with=${recipientId}`);
}

export async function broadcastNotificationAction(
  locale: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  await broadcastNotification({
    title: String(formData.get("title") ?? "").trim() || "Clinic",
    body: String(formData.get("body") ?? ""),
  });
  revalidateClinic();
  redirect(`/${loc}/messages`);
}
