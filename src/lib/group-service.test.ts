import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  createMany: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    groupMember: { findMany: mocks.findMany },
    groupSession: { create: mocks.create },
    groupAttendance: { createMany: mocks.createMany },
  },
}));

import { createGroupSessionSeries } from "./group-service";

describe("group sessions", () => {
  beforeEach(() => {
    mocks.create.mockReset();
    mocks.createMany.mockReset();
    mocks.findMany.mockReset();
  });

  it("creates one session per week", async () => {
    mocks.findMany.mockResolvedValue([{ patientId: "p1" }]);
    mocks.create.mockResolvedValue({ id: "s1" });
    mocks.createMany.mockResolvedValue({ count: 1 });
    const startAt = new Date("2026-08-23T10:00:00.000Z");
    const endAt = new Date("2026-08-23T11:00:00.000Z");
    await expect(
      createGroupSessionSeries({
        groupId: "g1",
        startAt,
        endAt,
        weeks: 3,
      })
    ).resolves.toMatchObject({ ok: true, ids: ["s1", "s1", "s1"] });
    expect(mocks.create).toHaveBeenCalledTimes(3);
  });
});
