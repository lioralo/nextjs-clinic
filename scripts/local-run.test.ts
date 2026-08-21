import { describe, expect, it } from "vitest";

import { parseArgs } from "./local-run.mjs";

describe("local-run args", () => {
  it("defaults to up with pull and seed", () => {
    expect(parseArgs(["node", "scripts/local-run.mjs"])).toEqual({
      command: "up",
      flags: { pull: true, seed: true, killPort: false },
    });
  });

  it("treats a leading flag as the default up command", () => {
    expect(parseArgs(["node", "scripts/local-run.mjs", "--no-pull"])).toEqual({
      command: "up",
      flags: { pull: false, seed: true, killPort: false },
    });
  });

  it("parses update flags", () => {
    expect(
      parseArgs([
        "node",
        "scripts/local-run.mjs",
        "update",
        "--no-seed",
        "--kill-port",
      ])
    ).toEqual({
      command: "update",
      flags: { pull: true, seed: false, killPort: true },
    });
  });
});
