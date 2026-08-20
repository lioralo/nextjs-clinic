import type { PatientStatus, PatientType, Prisma } from "@prisma/client";

import type { CrmStatusFilter } from "./copy";
import { prisma } from "./prisma";

export function patientStatusWhere(
  filter: CrmStatusFilter
): Prisma.PatientWhereInput {
  if (filter === "all") return {};
  if (filter === "candidate") {
    return { status: { in: ["CANDIDATE", "WAITING"] } };
  }
  if (filter === "ongoing") return { status: "ONGOING" };
  return { status: "ARCHIVED" };
}

export function patientSearchWhere(q: string): Prisma.PatientWhereInput {
  const term = q.trim();
  if (!term) return {};
  return {
    OR: [
      { firstName: { contains: term } },
      { lastName: { contains: term } },
      { phone: { contains: term } },
      { email: { contains: term } },
    ],
  };
}

export function parseCrmStatusFilter(value: string | undefined): CrmStatusFilter {
  if (value === "candidate" || value === "ongoing" || value === "archived") {
    return value;
  }
  return "all";
}

export async function listPatients() {
  return prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listCrmPatients(options: {
  status?: CrmStatusFilter;
  q?: string;
}) {
  const status = options.status ?? "all";
  const q = options.q ?? "";
  return prisma.patient.findMany({
    where: {
      AND: [patientStatusWhere(status), patientSearchWhere(q)],
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 200,
      include: {
        appointments: {
          where: {
            kind: "APPOINTMENT",
            status: { not: "CANCELLED" },
          },
          orderBy: { startAt: "asc" },
          include: { exceptions: true },
        },
      },
  });
}

export async function getPatient(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: { portalUser: true },
  });
}

export async function createPatient(data: {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  notesText?: string | null;
  status?: PatientStatus;
  patientType?: PatientType;
  birthDate?: Date | null;
  idNumber?: string | null;
}) {
  return prisma.patient.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notesText: data.notesText ?? null,
      status: data.status ?? "CANDIDATE",
      patientType: data.patientType ?? "PRIVATE",
      birthDate: data.birthDate ?? null,
      idNumber: data.idNumber ?? null,
    },
  });
}

export async function updatePatient(
  id: string,
  data: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
    notesText?: string | null;
    status?: PatientStatus;
    patientType?: PatientType;
    birthDate?: Date | null;
    idNumber?: string | null;
    reminderEmailEnabled?: boolean;
  }
) {
  return prisma.patient.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notesText: data.notesText ?? null,
      status: data.status,
      patientType: data.patientType,
      birthDate: data.birthDate ?? null,
      idNumber: data.idNumber ?? null,
      reminderEmailEnabled: data.reminderEmailEnabled,
    },
  });
}

export async function listNotes(patientId: string) {
  return prisma.note.findMany({
    where: { patientId },
    orderBy: [{ noteDate: "desc" }, { createdAt: "desc" }],
    include: {
      author: {
        select: { id: true, username: true },
      },
    },
  });
}

export async function nextSessionNumber(patientId: string) {
  const latest = await prisma.note.findFirst({
    where: { patientId, sessionNumber: { not: null } },
    orderBy: { sessionNumber: "desc" },
    select: { sessionNumber: true },
  });
  return (latest?.sessionNumber ?? 0) + 1;
}

export async function addNote(data: {
  patientId: string;
  authorId: string;
  content: string;
  sessionNumber?: number | null;
  noteDate?: Date | null;
  keyTopics?: string | null;
  shareWithPatient?: boolean;
}) {
  return prisma.note.create({
    data: {
      patientId: data.patientId,
      authorId: data.authorId,
      content: data.content,
      sessionNumber: data.sessionNumber ?? null,
      noteDate: data.noteDate ?? null,
      keyTopics: data.keyTopics ?? null,
      shareWithPatient: Boolean(data.shareWithPatient),
    },
  });
}

export async function updateNote(
  id: string,
  data: {
    content: string;
    sessionNumber?: number | null;
    noteDate?: Date | null;
    keyTopics?: string | null;
    shareWithPatient?: boolean;
  }
) {
  return prisma.note.update({
    where: { id },
    data: {
      content: data.content,
      sessionNumber: data.sessionNumber ?? null,
      noteDate: data.noteDate ?? null,
      keyTopics: data.keyTopics ?? null,
      shareWithPatient: Boolean(data.shareWithPatient),
    },
  });
}

export async function deleteNote(id: string) {
  return prisma.note.delete({
    where: { id },
  });
}
