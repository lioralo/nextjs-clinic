import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appointmentFindUnique: vi.fn(),
  cancelFindFirst: vi.fn(),
  cancelFindUnique: vi.fn(),
  cancelCreate: vi.fn(),
  cancelUpdate: vi.fn(),
  appointmentUpdate: vi.fn(),
  skipOccurrence: vi.fn(),
  notifyStaff: vi.fn(),
  createNotification: vi.fn(),
  sendMail: vi.fn(),
  revalidateClinic: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock("./appointment-service", () => ({
  skipOccurrence: mocks.skipOccurrence,
}));

vi.mock("./mail", () => ({
  sendMail: mocks.sendMail,
}));

vi.mock("./messaging-service", () => ({
  createNotification: mocks.createNotification,
  notifyStaff: mocks.notifyStaff,
  getPrimaryStaffUser: vi.fn(),
}));

vi.mock("./revalidate", () => ({
  revalidateClinic: mocks.revalidateClinic,
}));

vi.mock("./prisma", () => ({
  prisma: {
    appointment: {
      findUnique: mocks.appointmentFindUnique,
      update: mocks.appointmentUpdate,
    },
    cancelRequest: {
      findFirst: mocks.cancelFindFirst,
      findUnique: mocks.cancelFindUnique,
      create: mocks.cancelCreate,
      update: mocks.cancelUpdate,
    },
    user: { findMany: mocks.userFindMany },
  },
}));

import { approveCancelRequest, requestCancel } from "./cancel-service";

describe("cancel requests", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.sendMail.mockResolvedValue({ ok: true, skipped: true });
    mocks.notifyStaff.mockResolvedValue(undefined);
    mocks.userFindMany.mockResolvedValue([]);
  });

  it("creates a pending cancel request", async () => {
    mocks.appointmentFindUnique.mockResolvedValue({
      id: "a1",
      patientId: "p1",
      startAt: new Date("2026-08-21T09:00:00.000Z"),
      patient: { firstName: "Test", lastName: "Patient" },
    });
    mocks.cancelFindFirst.mockResolvedValue(null);
    mocks.cancelCreate.mockResolvedValue({ id: "c1" });

    await expect(
      requestCancel({
        appointmentId: "a1",
        patientId: "p1",
        reason: "cannot attend",
      })
    ).resolves.toMatchObject({ ok: true, id: "c1" });
    expect(mocks.cancelCreate).toHaveBeenCalled();
  });

  it("approve marks the appointment cancelled", async () => {
    mocks.cancelFindUnique.mockResolvedValue({
      id: "c1",
      status: "PENDING",
      appointmentId: "a1",
      patientId: "p1",
      reason: "busy",
      occurrenceStart: null,
      appointment: { id: "a1", isRecurring: false, startAt: new Date() },
      patient: {
        portalUser: null,
        email: null,
        reminderEmailEnabled: true,
      },
    });
    mocks.appointmentUpdate.mockResolvedValue({});
    mocks.cancelUpdate.mockResolvedValue({});

    await expect(approveCancelRequest("c1", "admin")).resolves.toEqual({
      ok: true,
    });
    expect(mocks.appointmentUpdate).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { status: "CANCELLED" },
    });
  });
});
