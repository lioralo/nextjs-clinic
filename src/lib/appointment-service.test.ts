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
  expandRecurringForRange,
  listAppointmentsInRange,
  moveAppointment,
  parseAppointmentRange,
  parseSeriesId,
  toCalendarEvent,
  type AppointmentRecord,
} from "./appointment-service";

function series(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    id: "a1",
    patientId: "p1",
    startAt: new Date("2026-08-19T09:00:00.000Z"),
    endAt: new Date("2026-08-19T10:00:00.000Z"),
    kind: "APPOINTMENT",
    title: null,
    isRecurring: false,
    recurrenceIntervalWeeks: null,
    recurrenceEndDate: null,
    meetingType: "IN_PERSON",
    patient: { firstName: "Test", lastName: "Patient" },
    ...overrides,
  };
}

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

  it("toCalendarEvent maps patient name, kind and ISO times", () => {
    const startAt = new Date("2026-08-19T09:00:00.000Z");
    const endAt = new Date("2026-08-19T10:00:00.000Z");
    expect(
      toCalendarEvent(
        series({
          startAt,
          endAt,
        })
      )
    ).toEqual({
      id: "a1",
      seriesId: "a1",
      patientId: "p1",
      title: "Test Patient",
      start: startAt.toISOString(),
      end: endAt.toISOString(),
      kind: "APPOINTMENT",
      isRecurring: false,
      meetingType: "IN_PERSON",
    });
  });

  it("expandRecurringForRange emits weekly occurrences in the window", () => {
    const occurrences = expandRecurringForRange(
      series({
        isRecurring: true,
        recurrenceIntervalWeeks: 1,
        recurrenceEndDate: new Date("2026-09-09T00:00:00.000Z"),
      }),
      new Date("2026-08-17T00:00:00.000Z"),
      new Date("2026-09-01T00:00:00.000Z")
    );
    expect(occurrences).toHaveLength(2);
    expect(occurrences[0].startAt.toISOString()).toBe(
      "2026-08-19T09:00:00.000Z"
    );
    expect(occurrences[1].startAt.toISOString()).toBe(
      "2026-08-26T09:00:00.000Z"
    );
  });

  it("vacancy events do not require a patient", () => {
    const event = toCalendarEvent(
      series({
        patientId: null,
        patient: null,
        kind: "VACANCY",
        title: "Open hour",
      })
    );
    expect(event.patientId).toBeNull();
    expect(event.title).toBe("Open hour");
    expect(event.kind).toBe("VACANCY");
  });

  it("parseSeriesId strips occurrence suffix", () => {
    expect(parseSeriesId("a1__2026-08-19T09:00:00.000Z")).toBe("a1");
    expect(parseSeriesId("a1")).toBe("a1");
  });

  it("listAppointmentsInRange queries overlapping and recurring visits", async () => {
    const start = new Date("2026-08-01T00:00:00.000Z");
    const end = new Date("2026-09-01T00:00:00.000Z");
    (prisma.appointment.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      []
    );

    await listAppointmentsInRange(start, end);

    expect(prisma.appointment.findMany).toHaveBeenCalledWith({
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
  });

  it("createAppointment stores a vacancy without a patient", async () => {
    (prisma.appointment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "v1",
    });
    const startAt = new Date("2026-08-19T09:00:00.000Z");
    const endAt = new Date("2026-08-19T10:00:00.000Z");

    await createAppointment({
      providerId: "u1",
      startAt,
      endAt,
      kind: "VACANCY",
      title: "Gap",
    });

    expect(prisma.appointment.create).toHaveBeenCalledWith({
      data: {
        patientId: null,
        providerId: "u1",
        startAt,
        endAt,
        status: "SCHEDULED",
        kind: "VACANCY",
        title: "Gap",
        meetingType: "IN_PERSON",
        meetingLink: null,
        isRecurring: false,
        recurrenceIntervalWeeks: null,
        recurrenceEndDate: null,
        recurrenceGroupId: null,
      },
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
        kind: "APPOINTMENT",
        title: null,
        meetingType: "IN_PERSON",
        meetingLink: null,
        isRecurring: false,
        recurrenceIntervalWeeks: null,
        recurrenceEndDate: null,
        recurrenceGroupId: null,
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
