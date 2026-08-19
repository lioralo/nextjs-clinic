import { randomBytes } from "node:crypto";

import { createPatient } from "./patient-service";
import { prisma } from "./prisma";
import {
  occupyVacancy,
  toCalendarEvent,
  listPublicVacancies,
  splitPersonName,
} from "./appointment-service";

const bookingAttempts = new Map<string, number[]>();

export function tooManyPublicBookings(token: string, now = Date.now()) {
  const windowStart = now - 60_000;
  const recent = (bookingAttempts.get(token) ?? []).filter(
    (stamp) => stamp > windowStart
  );
  if (recent.length >= 8) {
    bookingAttempts.set(token, recent);
    return true;
  }
  recent.push(now);
  bookingAttempts.set(token, recent);
  return false;
}

export async function getActivePublicBookingLink(token: string) {
  return prisma.publicBookingLink.findFirst({
    where: { token, isActive: true },
    include: { createdBy: true },
  });
}

export async function ensurePublicBookingLink(createdById: string) {
  const existing = await prisma.publicBookingLink.findFirst({
    where: { createdById, isActive: true },
  });
  if (existing) return existing;

  return prisma.publicBookingLink.create({
    data: {
      token: randomBytes(18).toString("base64url"),
      createdById,
      isActive: true,
    },
  });
}

export function validatePublicBookingInput(input: {
  name: string;
  phone: string;
  email: string;
  website: string;
  vacancyEventId: string;
}) {
  if (input.website.trim()) {
    return { ok: true as const, honeypot: true };
  }
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  if (!name) return { ok: false as const, error: "name" };
  if (!phone && !email) return { ok: false as const, error: "contact" };
  if (!input.vacancyEventId) {
    return { ok: false as const, error: "slot" };
  }
  return { ok: true as const, honeypot: false, name, phone, email };
}

export async function bookPublicVacancy(input: {
  token: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  vacancyEventId: string;
  birthDate?: string;
  notes?: string;
}) {
  if (tooManyPublicBookings(input.token)) {
    return { ok: false as const, error: "rate" };
  }

  const parsed = validatePublicBookingInput(input);
  if (!parsed.ok) return parsed;
  if (parsed.honeypot) return { ok: true as const, honeypot: true };

  const link = await getActivePublicBookingLink(input.token);
  if (!link) return { ok: false as const, error: "link" };

  const vacancies = await listPublicVacancies(10);
  const selected = vacancies
    .map((vacancy) => ({ vacancy, event: toCalendarEvent(vacancy) }))
    .find((entry) => entry.event.id === input.vacancyEventId);
  if (!selected) {
    return { ok: false as const, error: "slot" };
  }

  const names = splitPersonName(parsed.name);
  const patient = await createPatient({
    firstName: names.firstName,
    lastName: names.lastName,
    phone: parsed.phone || null,
    email: parsed.email || null,
    notesText: input.notes?.trim() || "Self-booked via public link",
    status: "WAITING",
    patientType: "PRIVATE",
    birthDate:
      input.birthDate && !Number.isNaN(Date.parse(input.birthDate))
        ? new Date(input.birthDate)
        : null,
  });

  const occupied = await occupyVacancy({
    vacancyEventId: input.vacancyEventId,
    patientId: patient.id,
    providerId: link.createdById,
    isRecurring: false,
  });
  if (!occupied.ok) {
    return occupied;
  }

  return { ok: true as const, patientId: patient.id };
}
