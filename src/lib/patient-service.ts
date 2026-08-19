import { prisma } from "./prisma";

export async function listPatients() {
  return prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getPatient(id: string) {
  return prisma.patient.findUnique({
    where: { id },
  });
}

export async function createPatient(data: {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  notesText?: string | null;
}) {
  return prisma.patient.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notesText: data.notesText ?? null,
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
    },
  });
}

export async function listNotes(patientId: string) {
  return prisma.note.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { id: true, username: true },
      },
    },
  });
}

export async function addNote(data: {
  patientId: string;
  authorId: string;
  content: string;
}) {
  return prisma.note.create({
    data: {
      patientId: data.patientId,
      authorId: data.authorId,
      content: data.content,
    },
  });
}
