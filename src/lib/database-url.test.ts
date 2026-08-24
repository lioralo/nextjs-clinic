import { describe, expect, it } from "vitest";

import { resolveDatabaseUrl } from "./database-url";

describe("resolveDatabaseUrl", () => {
  it("leaves non-file URLs unchanged", () => {
    expect(resolveDatabaseUrl("libsql://example.turso.io")).toBe(
      "libsql://example.turso.io"
    );
  });

  it("resolves a relative sqlite file from cwd", () => {
    const resolved = resolveDatabaseUrl("file:./dev.db");
    expect(resolved.startsWith("file:")).toBe(true);
    expect(resolved.endsWith("dev.db")).toBe(true);
    expect(resolved.includes("file:./")).toBe(false);
  });
});
