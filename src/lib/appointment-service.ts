import type { AppointmentKind, MeetingType } from "@prisma/client";

import { addWeeks, parseDateInput } from "./datetime";
import { prisma } from "./prisma";

export type RecurrenceExceptionRecord = {
  occurrenceStart: Date;
  kind: "SKIP" | "MOVED";
  newStartAt: Date | null;
  newEndAt: Date | null;
};

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
  meetingLink: string | null;
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
  meetingLink?: string | null;
  patient: { firstName: string; lastName: string } | null;
  exceptions?: RecurrenceExceptionRecord[];
  originalStartAt?: Date;
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

export function parseEventId(eventId: string): {
  seriesId: string;
  occurrenceStart: Date | null;
} {
  const separator = eventId.indexOf("__");
  if (separator === -1) {
    return { seriesId: eventId, occurrenceStart: null };
  }
  const seriesId = eventId.slice(0, separator);
  const occurrenceStart = parseDateInput(eventId.slice(separator + 2));
  return { seriesId, occurrenceStart };
}

export function parseSeriesId(eventId: string) {
  return parseEventId(eventId).seriesId;
}

function exceptionMap(exceptions: RecurrenceExceptionRecord[] | undefined) {
  const map = new Map<string, RecurrenceExceptionRecord>();
  for (const exception of exceptions ?? []) {
    map.set(exception.occurrenceStart.toISOString(), exception);
  }
  return map;
}

export function expandRecurringForRange(
  appointment: AppointmentRecord,
  rangeStart: Date,
  rangeEnd: Date
): AppointmentRecord[] {
  if (!appointment.isRecurring) {
    if (
      rangesOverlap(appointment.startAt, appointment.endAt, rangeStart, rangeEnd)
    ) {
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
  const exceptions = exceptionMap(appointment.exceptions);

  const occurrences: AppointmentRecord[] = [];
  let cursor = new Date(appointment.startAt);
  let guard = 0;
  while (cursor < rangeEnd && cursor <= seriesEnd && guard < 520) {
    const originalStart = new Date(cursor);
    const exception = exceptions.get(originalStart.toISOString());
    if (exception?.kind === "SKIP") {
      cursor = addWeeks(cursor, interval);
      guard += 1;
      continue;
    }
    if (
      exception?.kind === "MOVED" &&
      exception.newStartAt &&
      exception.newEndAt
    ) {
      if (
        rangesOverlap(
          exception.newStartAt,
          exception.newEndAt,
          rangeStart,
          rangeEnd
        )
      ) {
        occurrences.push({
          ...appointment,
          startAt: new Date(exception.newStartAt),
          endAt: new Date(exception.newEndAt),
          originalStartAt: originalStart,
        });
      }
      cursor = addWeeks(cursor, interval);
      guard += 1;
      continue;
    }

    const occurrenceEnd = new Date(cursor.getTime() + durationMs);
    if (rangesOverlap(cursor, occurrenceEnd, rangeStart, rangeEnd)) {
      occurrences.push({
        ...appointment,
        startAt: new Date(cursor),
        endAt: occurrenceEnd,
        originalStartAt: originalStart,
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
    | "exceptions"
  >,
  from = new Date()
): Date | null {
  const expanded = expandRecurringForRange(
    {
      id: "next",
      patientId: null,
      kind: "APPOINTMENT",
      title: null,
      meetingType: "IN_PERSON",
      patient: null,
      ...appointment,
    },
    from,
    addWeeks(from, 52)
  );
  const next = expanded.find((row) => row.startAt >= from);
  return next?.startAt ?? null;
}

export function eventTitle(appointment: AppointmentRecord): string {
  if (appointment.kind === "VACANCY") {
    return appointment.title?.trim() || "Vacant Slot";
  }
  if (appointment.kind === "BLOCK") {
    return appointment.title?.trim() || "Blocked";
  }
  if (appointment.patient) {
    return `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim();
  }
  return appointment.title?.trim() || "Appointment";
}

export function toCalendarEvent(
  appointment: AppointmentRecord
): CalendarEventDTO {
  const occurrenceKey = appointment.originalStartAt ?? appointment.startAt;
  return {
    id: appointment.isRecurring
      ? `${appointment.id}__${occurrenceKey.toISOString()}`
      : appointment.id,
    seriesId: appointment.id,
    patientId: appointment.patientId,
    title: eventTitle(appointment),
    start: appointment.startAt.toISOString(),
    end: appointment.endAt.toISOString(),
    kind: appointment.kind,
    isRecurring: appointment.isRecurring,
    meetingType: appointment.meetingType,
    meetingLink: appointment.meetingLink ?? null,
  };
}

function toRecord(row: {
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
  meetingLink?: string | null;
  patient: { firstName: string; lastName: string } | null;
  exceptions?: {
    occurrenceStart: Date;
    kind: "SKIP" | "MOVED";
    newStartAt: Date | null;
    newEndAt: Date | null;
  }[];
}): AppointmentRecord {
  return {
    id: row.id,
    patientId: row.patientId,
    startAt: row.startAt,
    endAt: row.endAt,
    kind: row.kind,
    title: row.title,
    isRecurring: row.isRecurring,
    recurrenceIntervalWeeks: row.recurrenceIntervalWeeks,
    recurrenceEndDate: row.recurrenceEndDate,
    meetingType: row.meetingType,
    meetingLink: row.meetingLink ?? null,
    patient: row.patient,
    exceptions: row.exceptions ?? [],
  };
}

const appointmentInclude = {
  patient: true,
  exceptions: true,
} as const;

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
    include: appointmentInclude,
    orderBy: { startAt: "asc" },
  });

  return rows.flatMap((row) =>
    expandRecurringForRange(toRecord(row), start, end)
  );
}

export async function findConflict(
  startAt: Date,
  endAt: Date,
  options?: { excludeSeriesId?: string; excludeOccurrenceIso?: string }
): Promise<AppointmentRecord | null> {
  const windowStart = new Date(startAt);
  windowStart.setDate(windowStart.getDate() - 1);
  const windowEnd = new Date(endAt);
  windowEnd.setDate(windowEnd.getDate() + 1);
  const occurrences = await listAppointmentsInRange(windowStart, windowEnd);

  for (const occurrence of occurrences) {
    if (
      options?.excludeSeriesId &&
      occurrence.id === options.excludeSeriesId
    ) {
      const occurrenceIso = (
        occurrence.originalStartAt ?? occurrence.startAt
      ).toISOString();
      if (
        !options.excludeOccurrenceIso ||
        occurrenceIso === options.excludeOccurrenceIso
      ) {
        continue;
      }
    }
    if (rangesOverlap(startAt, endAt, occurrence.startAt, occurrence.endAt)) {
      return occurrence;
    }
  }
  return null;
}

export function isVacancyOccurrence(
  occurrences: AppointmentRecord[],
  seriesId: string,
  startAt: Date
) {
  return occurrences.some(
    (occurrence) =>
      occurrence.kind === "VACANCY" &&
      occurrence.id === seriesId &&
      occurrence.startAt.getTime() === startAt.getTime()
  );
}

export async function listPublicVacancies(weeksAhead = 10) {
  const start = new Date();
  const end = addWeeks(start, weeksAhead);
  const occurrences = await listAppointmentsInRange(start, end);
  return occurrences.filter((occurrence) => occurrence.kind === "VACANCY");
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

export async function skipOccurrence(
  seriesId: string,
  occurrenceStart: Date
) {
  return prisma.recurrenceException.upsert({
    where: {
      appointmentId_occurrenceStart: {
        appointmentId: seriesId,
        occurrenceStart,
      },
    },
    update: { kind: "SKIP", newStartAt: null, newEndAt: null },
    create: {
      appointmentId: seriesId,
      occurrenceStart,
      kind: "SKIP",
    },
  });
}

export async function moveOccurrence(
  seriesId: string,
  occurrenceStart: Date,
  newStartAt: Date,
  newEndAt: Date
) {
  return prisma.recurrenceException.upsert({
    where: {
      appointmentId_occurrenceStart: {
        appointmentId: seriesId,
        occurrenceStart,
      },
    },
    update: { kind: "MOVED", newStartAt, newEndAt },
    create: {
      appointmentId: seriesId,
      occurrenceStart,
      kind: "MOVED",
      newStartAt,
      newEndAt,
    },
  });
}

export async function occupyVacancy(data: {
  vacancyEventId: string;
  patientId: string;
  providerId: string;
  isRecurring?: boolean;
  meetingType?: MeetingType;
  meetingLink?: string | null;
}) {
  const parsed = parseEventId(data.vacancyEventId);
  const vacancy = await prisma.appointment.findUnique({
    where: { id: parsed.seriesId },
    include: appointmentInclude,
  });
  if (!vacancy || vacancy.kind !== "VACANCY") {
    return { ok: false as const, error: "invalid" };
  }

  const record = toRecord(vacancy);
  const occurrenceStart =
    parsed.occurrenceStart ?? (vacancy.isRecurring ? null : vacancy.startAt);
  if (!occurrenceStart) {
    return { ok: false as const, error: "invalid" };
  }

  const durationMs = vacancy.endAt.getTime() - vacancy.startAt.getTime();
  const exceptions = exceptionMap(record.exceptions);
  const moved = exceptions.get(occurrenceStart.toISOString());
  const startAt =
    moved?.kind === "MOVED" && moved.newStartAt
      ? moved.newStartAt
      : occurrenceStart;
  const endAt =
    moved?.kind === "MOVED" && moved.newEndAt
      ? moved.newEndAt
      : new Date(occurrenceStart.getTime() + durationMs);

  const conflict = await findConflict(startAt, endAt, {
    excludeSeriesId: vacancy.id,
    excludeOccurrenceIso: occurrenceStart.toISOString(),
  });
  if (conflict) {
    return { ok: false as const, error: "conflict" };
  }

  if (vacancy.isRecurring) {
    await skipOccurrence(vacancy.id, occurrenceStart);
  } else {
    await prisma.appointment.delete({ where: { id: vacancy.id } });
  }

  const created = await createAppointment({
    patientId: data.patientId,
    providerId: data.providerId,
    startAt,
    endAt,
    kind: "APPOINTMENT",
    meetingType: data.meetingType,
    meetingLink: data.meetingLink,
    isRecurring: Boolean(data.isRecurring),
  });

  return { ok: true as const, id: created.id };
}

export function splitPersonName(name: string): {
  firstName: string;
  lastName: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "—" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}
