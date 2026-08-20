import type { AppointmentKind, MeetingType } from "@prisma/client";

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
import { parseDateInput, nextDateTimeOnWeekday } from "@/lib/datetime";
import { normalizeLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { ensurePublicBookingLink } from "@/lib/public-booking-service";
import { revalidateClinic } from "@/lib/revalidate";

export type RecurrenceScope = "this" | "series";

export type CalendarMutationResult =
  | { ok: true; id?: string; token?: string }
  | { ok: false; error: string };

export function calendarPath(
  locale: string,
  query?: Record<string, string | undefined>
) {
  const loc = normalizeLocale(locale) ?? "he";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return `/${loc}/calendar${suffix ? `?${suffix}` : ""}`;
}

function parseKind(value: string | undefined): AppointmentKind {
  if (value === "VACANCY" || value === "BLOCK" || value === "APPOINTMENT") {
    return value;
  }
  return "APPOINTMENT";
}

function parseMeetingType(value: string | undefined): MeetingType {
  return value === "ONLINE" ? "ONLINE" : "IN_PERSON";
}

function parseScope(value: string | undefined): RecurrenceScope {
  return value === "this" ? "this" : "series";
}

export async function createAppointmentRecord(
  userId: string,
  input: {
    kind?: string;
    patientId?: string;
    startAt: string;
    endAt: string;
    title?: string;
    meetingType?: string;
    meetingLink?: string;
    isRecurring?: boolean;
    recurrenceEndDate?: string;
  }
): Promise<CalendarMutationResult> {
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

export async function updateAppointmentTimesRecord(
  appointmentId: string,
  startAt: string,
  endAt: string,
  scope: RecurrenceScope = "series"
): Promise<CalendarMutationResult> {
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

export async function updateAppointmentDetailsRecord(input: {
  appointmentId: string;
  startAt: string;
  endAt: string;
  meetingType?: string;
  meetingLink?: string;
  scope?: RecurrenceScope;
}): Promise<CalendarMutationResult> {
  const times = await updateAppointmentTimesRecord(
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

export async function deleteAppointmentRecord(
  appointmentId: string,
  scope: RecurrenceScope = "series"
): Promise<CalendarMutationResult> {
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

export async function occupyVacancyRecord(
  userId: string,
  input: { vacancyEventId: string; patientId: string }
): Promise<CalendarMutationResult> {
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

function parseClockTime(
  value: string
): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

export function weekdayVacancyWindows(
  weekdays: number[],
  hours: number,
  minutes: number,
  durationMinutes: number,
  from = new Date()
) {
  const durationMs = Math.max(15, durationMinutes) * 60 * 1000;
  return [...new Set(weekdays.filter((day) => day >= 0 && day <= 6))].map(
    (weekday) => {
      const startAt = nextDateTimeOnWeekday(weekday, hours, minutes, from);
      return { weekday, startAt, endAt: new Date(startAt.getTime() + durationMs) };
    }
  );
}

export async function publishPublicVacancies(
  userId: string,
  input: {
    weekdays: number[];
    startTime: string;
    durationMinutes?: number;
    title?: string;
    isRecurring?: boolean;
    recurrenceEndDate?: string;
  }
): Promise<CalendarMutationResult> {
  const clock = parseClockTime(input.startTime);
  if (!clock && input.weekdays.length > 0) {
    return { ok: false, error: "invalid" };
  }

  if (clock && input.weekdays.length > 0) {
    const windows = weekdayVacancyWindows(
      input.weekdays,
      clock.hours,
      clock.minutes,
      input.durationMinutes ?? 60
    );
    for (const window of windows) {
      const created = await createAppointmentRecord(userId, {
        kind: "VACANCY",
        startAt: window.startAt.toISOString(),
        endAt: window.endAt.toISOString(),
        title: input.title?.trim() || "Vacant Slot",
        isRecurring: input.isRecurring !== false,
        recurrenceEndDate: input.recurrenceEndDate,
      });
      if (!created.ok && created.error !== "conflict") {
        return created;
      }
    }
  }

  const link = await ensurePublicBookingLink(userId);
  revalidateClinic();
  return { ok: true, token: link.token };
}

export async function applyCalendarIntent(
  userId: string,
  formData: FormData
): Promise<CalendarMutationResult> {
  const intent = String(formData.get("intent") ?? "create");

  if (intent === "publish") {
    const weekdays = formData
      .getAll("weekday")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value));
    return publishPublicVacancies(userId, {
      weekdays,
      startTime: String(formData.get("startTime") ?? "10:00"),
      durationMinutes: Number(formData.get("durationMinutes") ?? 60),
      title: String(formData.get("title") ?? ""),
      isRecurring: String(formData.get("isRecurring") ?? "") === "1",
      recurrenceEndDate: String(formData.get("recurrenceEndDate") ?? ""),
    });
  }

  if (intent === "public-link") {
    const link = await ensurePublicBookingLink(userId);
    return { ok: true, token: link.token };
  }

  if (intent === "occupy") {
    return occupyVacancyRecord(userId, {
      vacancyEventId: String(formData.get("vacancyEventId") ?? ""),
      patientId: String(formData.get("patientId") ?? ""),
    });
  }

  if (intent === "delete") {
    return deleteAppointmentRecord(
      String(formData.get("appointmentId") ?? ""),
      parseScope(String(formData.get("scope") ?? "series"))
    );
  }

  if (intent === "save") {
    return updateAppointmentDetailsRecord({
      appointmentId: String(formData.get("appointmentId") ?? ""),
      startAt: String(formData.get("startAt") ?? ""),
      endAt: String(formData.get("endAt") ?? ""),
      meetingType: String(formData.get("meetingType") ?? "IN_PERSON"),
      meetingLink: String(formData.get("meetingLink") ?? ""),
      scope: parseScope(String(formData.get("scope") ?? "series")),
    });
  }

  if (intent === "move") {
    return updateAppointmentTimesRecord(
      String(formData.get("appointmentId") ?? ""),
      String(formData.get("startAt") ?? ""),
      String(formData.get("endAt") ?? ""),
      parseScope(String(formData.get("scope") ?? "series"))
    );
  }

  return createAppointmentRecord(userId, {
    kind: String(formData.get("kind") ?? "APPOINTMENT"),
    patientId: String(formData.get("patientId") ?? ""),
    startAt: String(formData.get("startAt") ?? ""),
    endAt: String(formData.get("endAt") ?? ""),
    title: String(formData.get("title") ?? ""),
    meetingType: String(formData.get("meetingType") ?? "IN_PERSON"),
    meetingLink: String(formData.get("meetingLink") ?? ""),
    isRecurring: String(formData.get("isRecurring") ?? "") === "1",
    recurrenceEndDate: String(formData.get("recurrenceEndDate") ?? ""),
  });
}
