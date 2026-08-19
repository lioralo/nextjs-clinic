import { describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => {
  return {
    prisma: {
      patient: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      note: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

import { prisma } from "./prisma";
import {
  addNote,
  createPatient,
  getPatient,
  listNotes,
  listPatients,
  updatePatient,
} from "./patient-service";

describe("patient-service (CRUD wrappers)", () => {
  it("listPatients calls prisma.patient.findMany with ordering", async () => {
    (prisma.patient.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "p1" },
    ]);

    const result = await listPatients();

    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    expect(result).toEqual([{ id: "p1" }]);
  });

  it("getPatient looks up by id", async () => {
    (prisma.patient.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "p1",
    });

    const result = await getPatient("p1");

    expect(prisma.patient.findUnique).toHaveBeenCalledWith({
      where: { id: "p1" },
    });
    expect(result).toEqual({ id: "p1" });
  });

  it("createPatient calls prisma.patient.create with mapped fields", async () => {
    (prisma.patient.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "p2",
    });

    await createPatient({
      firstName: "A",
      lastName: "B",
      phone: "050",
      email: null,
      notesText: "hi",
    });

    expect(prisma.patient.create).toHaveBeenCalledWith({
      data: {
        firstName: "A",
        lastName: "B",
        phone: "050",
        email: null,
        notesText: "hi",
      },
    });
  });

  it("updatePatient maps editable fields", async () => {
    (prisma.patient.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "p1",
    });

    await updatePatient("p1", {
      firstName: "Ada",
      lastName: "Lovelace",
      phone: "050111",
      email: "ada@example.com",
      notesText: "updated",
    });

    expect(prisma.patient.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: {
        firstName: "Ada",
        lastName: "Lovelace",
        phone: "050111",
        email: "ada@example.com",
        notesText: "updated",
      },
    });
  });

  it("listNotes returns newest first with author", async () => {
    (prisma.note.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await listNotes("p1");

    expect(prisma.note.findMany).toHaveBeenCalledWith({
      where: { patientId: "p1" },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });
  });

  it("addNote creates a Note row", async () => {
    (prisma.note.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "n1",
    });

    await addNote({
      patientId: "p1",
      authorId: "u1",
      content: "Session went well",
    });

    expect(prisma.note.create).toHaveBeenCalledWith({
      data: {
        patientId: "p1",
        authorId: "u1",
        content: "Session went well",
      },
    });
  });
});
