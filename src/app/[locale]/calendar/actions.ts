"use server";

import type { AppointmentKind, MeetingType } from "@prisma/client";
import { redirect } from "next/navigation";

import {
  createAppointment,
  deleteAppointment,
  moveAppointment,
  parseAppointmentRange,
  parseSeriesId,
} from "@/lib/appointment-service";
import { parseDateInput } from "@/lib/datetime";
import { normalizeLocale } from "@/lib/locale";
import { revalidateClinic } from "@/lib/revalidate";
import { getSessionUser } from "@/lib/session";

export type AppointmentActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export type CalendarBookingInput = {
  kind?: AppointmentKind | string;
  patientId?: string;
  startAt: string;
  endAt: string;
  title?: string;
  meetingType?: MeetingType | string;
  meetingLink?: string;
  isRecurring?: boolean;
  recurrenceEndDate?: string;
  locale?: string;
};

function parseKind(value: string | undefined): AppointmentKind {
  if (value === "VACANCY" || value === "BLOCK" || value === "APPOINTMENT") {
    return value;
  }
  return "APPOINTMENT";
}

function parseMeetingType(value: string | undefined): MeetingType {
  return value === "ONLINE" ? "ONLINE" : "IN_PERSON";
}

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
    kind: String(formData.get("kind") ?? "APPOINTMENT"),
    patientId: String(formData.get("patientId") ?? ""),
    startAt: String(formData.get("startAt") ?? ""),
    endAt: String(formData.get("endAt") ?? ""),
    title: String(formData.get("title") ?? ""),
    meetingType: String(formData.get("meetingType") ?? "IN_PERSON"),
    meetingLink: String(formData.get("meetingLink") ?? ""),
    isRecurring: String(formData.get("isRecurring") ?? "") === "1",
    recurrenceEndDate: String(formData.get("recurrenceEndDate") ?? ""),
    locale,
  });

  if (result.ok) {
    redirect(`/${normalizeLocale(locale) ?? "he"}/calendar`);
  }
}

export async function createAppointmentRecord(
  input: CalendarBookingInput
): Promise<AppointmentActionResult> {
  const locale = input.locale ?? "he";
  const userId = await requireUserId(locale);
  const range = parseAppointmentRange(input.startAt, input.endAt);
  const kind = parseKind(input.kind);

  if (!range) {
    return { ok: false, error: "invalid" };
  }
  if (kind === "APPOINTMENT" && !input.patientId) {
    return { ok: false, error: "invalid" };
  }

  const created = await createAppointment({
    patientId: kind === "APPOINTMENT" ? input.patientId : null,
    providerId: userId,
    startAt: range.startAt,
    endAt: range.endAt,
    kind,
    title: input.title?.trim() || null,
    meetingType: parseMeetingType(input.meetingType),
    meetingLink: input.meetingLink?.trim() || null,
    isRecurring: Boolean(input.isRecurring),
    recurrenceIntervalWeeks: 1,
    recurrenceEndDate: input.recurrenceEndDate
      ? parseDateInput(input.recurrenceEndDate)
      : null,
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
  const seriesId = parseSeriesId(appointmentId);
  if (!seriesId || !range) {
    return { ok: false, error: "invalid" };
  }

  await moveAppointment(seriesId, range.startAt, range.endAt);
  revalidateClinic();
  return { ok: true, id: seriesId };
}

export async function deleteAppointmentAction(
  appointmentId: string
): Promise<AppointmentActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const seriesId = parseSeriesId(appointmentId);
  if (!seriesId) {
    return { ok: false, error: "invalid" };
  }

  await deleteAppointment(seriesId);
  revalidateClinic();
  return { ok: true, id: seriesId };
}
