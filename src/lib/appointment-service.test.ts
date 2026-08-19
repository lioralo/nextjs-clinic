import { describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => {
  return {
    prisma: {
      appointment: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

import { prisma } from "./prisma";
import {
  createAppointment,
  deleteAppointment,
  listAppointmentsInRange,
  moveAppointment,
  parseAppointmentRange,
  toCalendarEvent,
} from "./appointment-service";

describe("appointment-service", () => {
  it("parseAppointmentRange accepts a valid window", () => {
    const range = parseAppointmentRange(
      "2026-08-19T09:00",
      "2026-08-19T10:00"
    );
    expect(range).not.toBeNull();
    expect(range?.endAt.getTime()).toBeGreaterThan(range!.startAt.getTime());
  });

  it("parseAppointmentRange rejects inverted or invalid times", () => {
    expect(
      parseAppointmentRange("2026-08-19T10:00", "2026-08-19T09:00")
    ).toBeNull();
    expect(parseAppointmentRange("nope", "2026-08-19T09:00")).toBeNull();
  });

  it("toCalendarEvent maps patient name and ISO times", () => {
    const startAt = new Date("2026-08-19T09:00:00.000Z");
    const endAt = new Date("2026-08-19T10:00:00.000Z");
    expect(
      toCalendarEvent({
        id: "a1",
        patientId: "p1",
        startAt,
        endAt,
        patient: { firstName: "Test", lastName: "Patient" },
      })
    ).toEqual({
      id: "a1",
      patientId: "p1",
      title: "Test Patient",
      start: startAt.toISOString(),
      end: endAt.toISOString(),
    });
  });

  it("listAppointmentsInRange queries overlapping scheduled visits", async () => {
    const start = new Date("2026-08-01T00:00:00.000Z");
    const end = new Date("2026-09-01T00:00:00.000Z");
    (prisma.appointment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      []
    );

    await listAppointmentsInRange(start, end);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith({
      where: {
        startAt: { lt: end },
        endAt: { gt: start },
        status: { not: "CANCELLED" },
      },
      include: { patient: true },
      orderBy: { startAt: "asc" },
    });
  });

  it("createAppointment stores scheduled visit times", async () => {
    (prisma.appointment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
    });
    const startAt = new Date("2026-08-19T09:00:00.000Z");
    const endAt = new Date("2026-08-19T10:00:00.000Z");

    await createAppointment({
      patientId: "p1",
      providerId: "u1",
      startAt,
      endAt,
    });

    expect(prisma.appointment.create).toHaveBeenCalledWith({
      data: {
        patientId: "p1",
        providerId: "u1",
        startAt,
        endAt,
        status: "SCHEDULED",
      },
    });
  });

  it("moveAppointment updates start and end", async () => {
    (prisma.appointment.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
    });
    const startAt = new Date("2026-08-20T09:00:00.000Z");
    const endAt = new Date("2026-08-20T10:00:00.000Z");

    await moveAppointment("a1", startAt, endAt);

    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { startAt, endAt },
    });
  });

  it("deleteAppointment deletes by id", async () => {
    (prisma.appointment.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "a1",
    });

    await deleteAppointment("a1");

    expect(prisma.appointment.delete).toHaveBeenCalledWith({
      where: { id: "a1" },
    });
  });
});
