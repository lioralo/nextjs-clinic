"use server";

import { redirect } from "next/navigation";

import {
  broadcastNotification,
  sendMessage,
} from "@/lib/messaging-service";
import { requireStaffUser } from "@/lib/session";
import { revalidateClinic } from "@/lib/revalidate";

export async function sendStaffMessageAction(
  locale: string,
  recipientId: string,
  formData: FormData
) {
  const { loc, user } = await requireStaffUser(locale);
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
  const { loc } = await requireStaffUser(locale);
  await broadcastNotification({
    title: String(formData.get("title") ?? "").trim() || "Clinic",
    body: String(formData.get("body") ?? ""),
  });
  revalidateClinic();
  redirect(`/${loc}/messages`);
}
