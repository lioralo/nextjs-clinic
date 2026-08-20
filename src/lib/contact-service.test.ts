import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  notifyStaff: vi.fn(),
  revalidateClinic: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: { contactInquiry: { create: mocks.create } },
}));

vi.mock("./messaging-service", () => ({
  notifyStaff: mocks.notifyStaff,
}));

vi.mock("./revalidate", () => ({ revalidateClinic: mocks.revalidateClinic }));

import { submitContactInquiry } from "./contact-service";

describe("contact inquiry", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
    mocks.create.mockResolvedValue({ id: "inq1" });
    mocks.notifyStaff.mockResolvedValue(undefined);
  });

  it("requires name, message, and email or phone", async () => {
    await expect(
      submitContactInquiry({ name: "Ada", message: "Hello" })
    ).resolves.toEqual({ ok: false, error: "contact" });
  });

  it("stores an inquiry and notifies staff", async () => {
    await expect(
      submitContactInquiry({
        name: "Ada",
        email: "ada@example.com",
        message: "Need an intake",
      })
    ).resolves.toEqual({ ok: true, id: "inq1" });
    expect(mocks.notifyStaff).toHaveBeenCalledWith(
      expect.objectContaining({ category: "CONTACT" })
    );
  });
});
