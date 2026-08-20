import { describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => {
  return {
    prisma: {
      patient: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      note: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

import { prisma } from "./prisma";
import {
  addNote,
  createPatient,
  getPatient,
  listCrmPatients,
  listNotes,
  listPatients,
  patientSearchWhere,
  patientStatusWhere,
  parseCrmStatusFilter,
  updatePatient,
} from "./patient-service";

describe("patient CRM filters", () => {
  it("parseCrmStatusFilter maps known values", () => {
    expect(parseCrmStatusFilter("ongoing")).toBe("ongoing");
    expect(parseCrmStatusFilter("candidate")).toBe("candidate");
    expect(parseCrmStatusFilter("nope")).toBe("all");
  });

  it("patientStatusWhere groups candidate and waiting", () => {
    expect(patientStatusWhere("all")).toEqual({});
    expect(patientStatusWhere("candidate")).toEqual({
      status: { in: ["CANDIDATE", "WAITING"] },
    });
    expect(patientStatusWhere("ongoing")).toEqual({ status: "ONGOING" });
    expect(patientStatusWhere("archived")).toEqual({ status: "ARCHIVED" });
  });

  it("patientSearchWhere matches name email and phone", () => {
    expect(patientSearchWhere("  ")).toEqual({});
    expect(patientSearchWhere("Ada")).toEqual({
      OR: [
        { firstName: { contains: "Ada" } },
        { lastName: { contains: "Ada" } },
        { phone: { contains: "Ada" } },
        { email: { contains: "Ada" } },
      ],
    });
  });
});

describe("patient-service (CRUD wrappers)", () => {
  it("listPatients calls prisma.patient.findMany with ordering", async () => {
    (prisma.patient.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "p1" },
    ]);

    const result = await listPatients();

    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    expect(result).toEqual([{ id: "p1" }]);
  });

  it("listCrmPatients applies status and search filters", async () => {
    (prisma.patient.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await listCrmPatients({ status: "ongoing", q: "Test" });

    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: {
        AND: [
          { status: "ONGOING" },
          {
            OR: [
              { firstName: { contains: "Test" } },
              { lastName: { contains: "Test" } },
              { phone: { contains: "Test" } },
              { email: { contains: "Test" } },
            ],
          },
        ],
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
  });

  it("getPatient looks up by id", async () => {
    (prisma.patient.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "p1",
    });

    const result = await getPatient("p1");

    expect(prisma.patient.findUnique).toHaveBeenCalledWith({
      where: { id: "p1" },
      include: { portalUser: true },
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
        status: "CANDIDATE",
        patientType: "PRIVATE",
        birthDate: null,
        idNumber: null,
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
      status: "ONGOING",
      patientType: "PRIVATE",
    });

    expect(prisma.patient.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: {
        firstName: "Ada",
        lastName: "Lovelace",
        phone: "050111",
        email: "ada@example.com",
        notesText: "updated",
        status: "ONGOING",
        patientType: "PRIVATE",
        birthDate: null,
        idNumber: null,
        reminderEmailEnabled: undefined,
      },
    });
  });

  it("listNotes returns newest first with author", async () => {
    (prisma.note.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await listNotes("p1");

    expect(prisma.note.findMany).toHaveBeenCalledWith({
      where: { patientId: "p1" },
      orderBy: [{ noteDate: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });
  });

  it("addNote creates a Note row with session fields", async () => {
    (prisma.note.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "n1",
    });
    const noteDate = new Date("2026-08-19");

    await addNote({
      patientId: "p1",
      authorId: "u1",
      content: "Session went well",
      sessionNumber: 2,
      noteDate,
      keyTopics: "sleep",
    });

    expect(prisma.note.create).toHaveBeenCalledWith({
      data: {
        patientId: "p1",
        authorId: "u1",
        content: "Session went well",
        sessionNumber: 2,
        noteDate,
        keyTopics: "sleep",
        shareWithPatient: false,
      },
    });
  });
});
