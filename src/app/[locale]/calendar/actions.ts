"use server";

import { redirect } from "next/navigation";

import {
  createAppointment,
  deleteAppointment,
  moveAppointment,
  parseAppointmentRange,
} from "@/lib/appointment-service";
import { normalizeLocale } from "@/lib/locale";
import { revalidateClinic } from "@/lib/revalidate";
import { getSessionUser } from "@/lib/session";

export type AppointmentActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

async function requireUserId(locale: string): Promise<string> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${normalizeLocale(locale) ?? "he"}/login`);
  }
  return user.id;
}

export async function createAppointmentFormAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "he");
  const result = await createAppointmentRecord({
    patientId: String(formData.get("patientId") ?? ""),
    startAt: String(formData.get("startAt") ?? ""),
    endAt: String(formData.get("endAt") ?? ""),
    locale,
  });

  if (result.ok) {
    redirect(`/${normalizeLocale(locale) ?? "he"}/calendar`);
  }
}

export async function createAppointmentRecord(input: {
  patientId: string;
  startAt: string;
  endAt: string;
  locale?: string;
}): Promise<AppointmentActionResult> {
  const locale = input.locale ?? "he";
  const userId = await requireUserId(locale);
  const range = parseAppointmentRange(input.startAt, input.endAt);

  if (!input.patientId || !range) {
    return { ok: false, error: "invalid" };
  }

  const created = await createAppointment({
    patientId: input.patientId,
    providerId: userId,
    startAt: range.startAt,
    endAt: range.endAt,
  });

  revalidateClinic();
  return { ok: true, id: created.id };
}

export async function updateAppointmentTimesAction(
  appointmentId: string,
  startAt: string,
  endAt: string
): Promise<AppointmentActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const range = parseAppointmentRange(startAt, endAt);
  if (!appointmentId || !range) {
    return { ok: false, error: "invalid" };
  }

  await moveAppointment(appointmentId, range.startAt, range.endAt);
  revalidateClinic();
  return { ok: true, id: appointmentId };
}

export async function deleteAppointmentAction(
  appointmentId: string
): Promise<AppointmentActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  if (!appointmentId) {
    return { ok: false, error: "invalid" };
  }

  await deleteAppointment(appointmentId);
  revalidateClinic();
  return { ok: true, id: appointmentId };
}
