import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    message: { create: mocks.create },
  },
}));

import { sendMessage } from "./messaging-service";

describe("internal messages", () => {
  beforeEach(() => {
    mocks.create.mockReset();
  });

  it("stores a trimmed staff–patient message", async () => {
    mocks.create.mockResolvedValue({ id: "m1" });
    await expect(
      sendMessage({
        senderId: "patient-user",
        recipientId: "admin",
        body: "  hello clinic  ",
      })
    ).resolves.toEqual({ ok: true, id: "m1" });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        senderId: "patient-user",
        recipientId: "admin",
        body: "hello clinic",
      },
    });
  });

  it("rejects an empty body", async () => {
    await expect(
      sendMessage({ senderId: "a", recipientId: "b", body: "   " })
    ).resolves.toEqual({ ok: false, error: "empty" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
