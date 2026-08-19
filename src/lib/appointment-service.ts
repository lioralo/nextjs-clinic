import type { AppointmentKind, MeetingType } from "@prisma/client";

import { addWeeks, parseDateInput } from "./datetime";
import { prisma } from "./prisma";

export type CalendarEventDTO = {
  id: string;
  seriesId: string;
  patientId: string | null;
  title: string;
  start: string;
  end: string;
  kind: AppointmentKind;
  isRecurring: boolean;
  meetingType: MeetingType;
};

export type PatientOptionDTO = {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
  patientType: string;
};

export type AppointmentRecord = {
  id: string;
  patientId: string | null;
  startAt: Date;
  endAt: Date;
  kind: AppointmentKind;
  title: string | null;
  isRecurring: boolean;
  recurrenceIntervalWeeks: number | null;
  recurrenceEndDate: Date | null;
  meetingType: MeetingType;
  patient: { firstName: string; lastName: string } | null;
};

export function parseAppointmentRange(
  startAtRaw: string,
  endAtRaw: string
): { startAt: Date; endAt: Date } | null {
  const startAt = parseDateInput(startAtRaw);
  const endAt = parseDateInput(endAtRaw);
  if (!startAt || !endAt) return null;
  if (endAt <= startAt) return null;
  return { startAt, endAt };
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
) {
  return aStart < bEnd && aEnd > bStart;
}

export function expandRecurringForRange(
  appointment: AppointmentRecord,
  rangeStart: Date,
  rangeEnd: Date
): AppointmentRecord[] {
  if (!appointment.isRecurring) {
    if (rangesOverlap(appointment.startAt, appointment.endAt, rangeStart, rangeEnd)) {
      return [appointment];
    }
    return [];
  }

  const interval = Math.max(1, appointment.recurrenceIntervalWeeks ?? 1);
  const durationMs = appointment.endAt.getTime() - appointment.startAt.getTime();
  const seriesEnd = appointment.recurrenceEndDate
    ? new Date(appointment.recurrenceEndDate)
    : rangeEnd;
  seriesEnd.setHours(23, 59, 59, 999);

  const occurrences: AppointmentRecord[] = [];
  let cursor = new Date(appointment.startAt);
  let guard = 0;
  while (cursor < rangeEnd && cursor <= seriesEnd && guard < 520) {
    const occurrenceEnd = new Date(cursor.getTime() + durationMs);
    if (rangesOverlap(cursor, occurrenceEnd, rangeStart, rangeEnd)) {
      occurrences.push({
        ...appointment,
        startAt: new Date(cursor),
        endAt: occurrenceEnd,
      });
    }
    cursor = addWeeks(cursor, interval);
    guard += 1;
  }
  return occurrences;
}

export function nextOccurrenceAt(
  appointment: Pick<
    AppointmentRecord,
    | "startAt"
    | "endAt"
    | "isRecurring"
    | "recurrenceIntervalWeeks"
    | "recurrenceEndDate"
  >,
  from = new Date()
): Date | null {
  if (!appointment.isRecurring) {
    return appointment.startAt >= from ? appointment.startAt : null;
  }

  const interval = Math.max(1, appointment.recurrenceIntervalWeeks ?? 1);
  const seriesEnd = appointment.recurrenceEndDate
    ? new Date(appointment.recurrenceEndDate)
    : null;
  let cursor = new Date(appointment.startAt);
  let guard = 0;
  while (guard < 520) {
    if (seriesEnd && cursor > seriesEnd) return null;
    if (cursor >= from) return cursor;
    cursor = addWeeks(cursor, interval);
    guard += 1;
  }
  return null;
}

export function eventTitle(appointment: AppointmentRecord): string {
  if (appointment.kind === "VACANCY") return appointment.title?.trim() || "Vacant Slot";
  if (appointment.kind === "BLOCK") return appointment.title?.trim() || "Blocked";
  if (appointment.patient) {
    return `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim();
  }
  return appointment.title?.trim() || "Appointment";
}

export function toCalendarEvent(
  appointment: AppointmentRecord
): CalendarEventDTO {
  return {
    id: appointment.isRecurring
      ? `${appointment.id}__${appointment.startAt.toISOString()}`
      : appointment.id,
    seriesId: appointment.id,
    patientId: appointment.patientId,
    title: eventTitle(appointment),
    start: appointment.startAt.toISOString(),
    end: appointment.endAt.toISOString(),
    kind: appointment.kind,
    isRecurring: appointment.isRecurring,
    meetingType: appointment.meetingType,
  };
}

export async function listAppointmentsInRange(start: Date, end: Date) {
  const rows = await prisma.appointment.findMany({
    where: {
      status: { not: "CANCELLED" },
      OR: [
        {
          isRecurring: false,
          startAt: { lt: end },
          endAt: { gt: start },
        },
        {
          isRecurring: true,
          startAt: { lt: end },
          OR: [
            { recurrenceEndDate: null },
            { recurrenceEndDate: { gte: start } },
          ],
        },
      ],
    },
    include: { patient: true },
    orderBy: { startAt: "asc" },
  });

  return rows.flatMap((row) =>
    expandRecurringForRange(row, start, end)
  );
}

export async function createAppointment(data: {
  patientId?: string | null;
  providerId: string;
  startAt: Date;
  endAt: Date;
  kind?: AppointmentKind;
  title?: string | null;
  meetingType?: MeetingType;
  meetingLink?: string | null;
  isRecurring?: boolean;
  recurrenceIntervalWeeks?: number | null;
  recurrenceEndDate?: Date | null;
}) {
  const kind = data.kind ?? "APPOINTMENT";
  const isRecurring = Boolean(data.isRecurring);
  return prisma.appointment.create({
    data: {
      patientId: kind === "APPOINTMENT" ? data.patientId ?? null : null,
      providerId: data.providerId,
      startAt: data.startAt,
      endAt: data.endAt,
      status: "SCHEDULED",
      kind,
      title: data.title ?? null,
      meetingType: data.meetingType ?? "IN_PERSON",
      meetingLink: data.meetingLink ?? null,
      isRecurring,
      recurrenceIntervalWeeks: isRecurring
        ? data.recurrenceIntervalWeeks ?? 1
        : null,
      recurrenceEndDate: isRecurring ? data.recurrenceEndDate ?? null : null,
      recurrenceGroupId: isRecurring ? crypto.randomUUID() : null,
    },
  });
}

export async function moveAppointment(
  id: string,
  startAt: Date,
  endAt: Date
) {
  return prisma.appointment.update({
    where: { id },
    data: { startAt, endAt },
  });
}

export async function deleteAppointment(id: string) {
  return prisma.appointment.delete({
    where: { id },
  });
}

export function parseSeriesId(eventId: string) {
  const [seriesId] = eventId.split("__");
  return seriesId || eventId;
}
