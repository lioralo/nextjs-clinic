"use server";

import { redirect } from "next/navigation";

import {
  approveCancelRequest,
  rejectCancelRequest,
  requestCancel,
} from "@/lib/cancel-service";
import { normalizeLocale } from "@/lib/locale";
import { getSessionUser } from "@/lib/session";

export async function approveCancelAction(locale: string, requestId: string) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  await approveCancelRequest(requestId, user.id);
  redirect(`/${loc}/cancel-requests`);
}

export async function rejectCancelAction(locale: string, requestId: string) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user || user.role === "PATIENT") redirect(`/${loc}/login`);
  await rejectCancelRequest(requestId, user.id);
  redirect(`/${loc}/cancel-requests`);
}

export async function patientRequestCancelAction(
  locale: string,
  appointmentId: string,
  formData: FormData
) {
  const loc = normalizeLocale(locale) ?? "he";
  const user = await getSessionUser();
  if (!user?.patientId || user.role !== "PATIENT") {
    redirect(`/${loc}/login`);
  }
  await requestCancel({
    appointmentId,
    patientId: user.patientId,
    reason: String(formData.get("reason") ?? ""),
    occurrenceStart: formData.get("occurrenceStart")
      ? new Date(String(formData.get("occurrenceStart")))
      : null,
    notifyPatientUserId: user.id,
  });
  redirect(`/${loc}/patient`);
}
