import { parseDateInput } from "./datetime";
import { prisma } from "./prisma";

export type CalendarEventDTO = {
  id: string;
  patientId: string;
  title: string;
  start: string;
  end: string;
};

export type PatientOptionDTO = {
  id: string;
  firstName: string;
  lastName: string;
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

export function toCalendarEvent(appointment: {
  id: string;
  patientId: string;
  startAt: Date;
  endAt: Date;
  patient: { firstName: string; lastName: string };
}): CalendarEventDTO {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    title: `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim(),
    start: appointment.startAt.toISOString(),
    end: appointment.endAt.toISOString(),
  };
}

export async function listAppointmentsInRange(start: Date, end: Date) {
  return prisma.appointment.findMany({
    where: {
      startAt: { lt: end },
      endAt: { gt: start },
      status: { not: "CANCELLED" },
    },
    include: { patient: true },
    orderBy: { startAt: "asc" },
  });
}

export async function createAppointment(data: {
  patientId: string;
  providerId: string;
  startAt: Date;
  endAt: Date;
}) {
  return prisma.appointment.create({
    data: {
      patientId: data.patientId,
      providerId: data.providerId,
      startAt: data.startAt,
      endAt: data.endAt,
      status: "SCHEDULED",
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
