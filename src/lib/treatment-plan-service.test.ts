import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    treatmentPlan: { create: mocks.create },
  },
}));

vi.mock("./revalidate", () => ({ revalidateClinic: vi.fn() }));

import { createTreatmentPlan } from "./treatment-plan-service";

describe("treatment plans", () => {
  beforeEach(() => {
    mocks.create.mockReset();
  });

  it("requires at least one goal", async () => {
    await expect(
      createTreatmentPlan({
        patientId: "p1",
        goals: [{ description: "  " }],
      })
    ).resolves.toEqual({ ok: false, error: "goals" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates a plan with numbered goals", async () => {
    mocks.create.mockResolvedValue({ id: "plan1" });
    await expect(
      createTreatmentPlan({
        patientId: "p1",
        diagnosisDescription: "GAD",
        shareWithPatient: true,
        goals: [{ description: "Reduce anxiety" }, { description: "Sleep 7h" }],
      })
    ).resolves.toEqual({ ok: true, id: "plan1" });
    expect(mocks.create).toHaveBeenCalled();
    const data = mocks.create.mock.calls[0][0].data;
    expect(data.shareWithPatient).toBe(true);
    expect(data.goals.create).toHaveLength(2);
    expect(data.goals.create[0].goalNumber).toBe(1);
  });
});
