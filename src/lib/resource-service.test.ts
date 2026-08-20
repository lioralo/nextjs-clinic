import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findUniqueAssign: vi.fn(),
}));

vi.mock("./prisma", () => ({
  prisma: {
    resource: { findUnique: mocks.findUnique },
    patientResource: { findUnique: mocks.findUniqueAssign },
  },
}));

import { canAccessResource } from "./resource-service";

describe("resource ACL", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.findUniqueAssign.mockReset();
  });

  it("allows staff to download anything", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "r1",
      url: "https://example.com/file",
      allowPatientView: false,
      allowPatientDownload: false,
      isPublic: false,
    });
    await expect(
      canAccessResource({
        resourceId: "r1",
        action: "download",
        user: { id: "u1", role: "ADMIN" },
      })
    ).resolves.toMatchObject({ ok: true });
  });

  it("denies patient download when the flag is off", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "r1",
      url: "https://example.com/file",
      allowPatientView: true,
      allowPatientDownload: false,
      isPublic: true,
    });
    await expect(
      canAccessResource({
        resourceId: "r1",
        action: "download",
        user: { id: "p1", role: "PATIENT", patientId: "pat1" },
      })
    ).resolves.toEqual({ ok: false, error: "forbidden" });
  });
});
