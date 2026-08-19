"use server";

import type { AppointmentKind, MeetingType } from "@prisma/client";
import { redirect } from "next/navigation";

import {
  createAppointment,
  deleteAppointment,
  findConflict,
  moveAppointment,
  moveOccurrence,
  occupyVacancy,
  parseAppointmentRange,
  parseEventId,
  skipOccurrence,
} from "@/lib/appointment-service";
import { parseDateInput } from "@/lib/datetime";
import { normalizeLocale } from "@/lib/locale";
import { ensurePublicBookingLink } from "@/lib/public-booking-service";
import { revalidateClinic } from "@/lib/revalidate";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export type AppointmentActionResult =
  | { ok: true; id?: string; token?: string }
  | { ok: false; error: string };

export type RecurrenceScope = "this" | "series";

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

  const conflict = await findConflict(range.startAt, range.endAt);
  if (conflict) {
    return { ok: false, error: "conflict" };
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
  endAt: string,
  scope: RecurrenceScope = "series"
): Promise<AppointmentActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const range = parseAppointmentRange(startAt, endAt);
  const parsed = parseEventId(appointmentId);
  if (!parsed.seriesId || !range) {
    return { ok: false, error: "invalid" };
  }

  const existing = await prisma.appointment.findUnique({
    where: { id: parsed.seriesId },
  });
  if (!existing) {
    return { ok: false, error: "invalid" };
  }

  const thisOccurrence =
    existing.isRecurring && scope === "this" && parsed.occurrenceStart;
  const conflict = await findConflict(range.startAt, range.endAt, {
    excludeSeriesId: existing.id,
    excludeOccurrenceIso: thisOccurrence
      ? parsed.occurrenceStart?.toISOString()
      : undefined,
  });
  if (conflict) {
    return { ok: false, error: "conflict" };
  }

  if (thisOccurrence && parsed.occurrenceStart) {
    await moveOccurrence(
      existing.id,
      parsed.occurrenceStart,
      range.startAt,
      range.endAt
    );
  } else {
    await moveAppointment(existing.id, range.startAt, range.endAt);
  }

  revalidateClinic();
  return { ok: true, id: existing.id };
}

export async function updateAppointmentDetailsAction(input: {
  appointmentId: string;
  startAt: string;
  endAt: string;
  meetingType?: string;
  meetingLink?: string;
  scope?: RecurrenceScope;
}): Promise<AppointmentActionResult> {
  const times = await updateAppointmentTimesAction(
    input.appointmentId,
    input.startAt,
    input.endAt,
    input.scope ?? "series"
  );
  if (!times.ok) return times;

  const seriesId = parseEventId(input.appointmentId).seriesId;
  await prisma.appointment.update({
    where: { id: seriesId },
    data: {
      meetingType: parseMeetingType(input.meetingType),
      meetingLink: input.meetingLink?.trim() || null,
    },
  });
  revalidateClinic();
  return { ok: true, id: seriesId };
}

export async function deleteAppointmentAction(
  appointmentId: string,
  scope: RecurrenceScope = "series"
): Promise<AppointmentActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }

  const parsed = parseEventId(appointmentId);
  if (!parsed.seriesId) {
    return { ok: false, error: "invalid" };
  }

  const existing = await prisma.appointment.findUnique({
    where: { id: parsed.seriesId },
  });
  if (!existing) {
    return { ok: false, error: "invalid" };
  }

  if (existing.isRecurring && scope === "this" && parsed.occurrenceStart) {
    await skipOccurrence(existing.id, parsed.occurrenceStart);
  } else {
    await deleteAppointment(existing.id);
  }

  revalidateClinic();
  return { ok: true, id: existing.id };
}

export async function occupyVacancyAction(input: {
  vacancyEventId: string;
  patientId: string;
  locale?: string;
}): Promise<AppointmentActionResult> {
  const locale = input.locale ?? "he";
  const userId = await requireUserId(locale);
  if (!input.patientId) {
    return { ok: false, error: "invalid" };
  }

  const patient = await prisma.patient.findUnique({
    where: { id: input.patientId },
  });
  if (!patient) {
    return { ok: false, error: "invalid" };
  }

  const result = await occupyVacancy({
    vacancyEventId: input.vacancyEventId,
    patientId: patient.id,
    providerId: userId,
    isRecurring: patient.status === "ONGOING",
  });
  if (!result.ok) {
    return result;
  }
  revalidateClinic(patient.id);
  return { ok: true, id: result.id };
}

export async function ensurePublicBookingLinkAction(): Promise<AppointmentActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "unauthorized" };
  }
  const link = await ensurePublicBookingLink(user.id);
  return { ok: true, token: link.token };
}
