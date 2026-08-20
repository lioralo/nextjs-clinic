import { describe, expect, it } from "vitest";

import { isNavActive, pageTitleFromPath } from "./clinic-nav";

describe("clinic nav helpers", () => {
  it("marks dashboard only on the exact locale root", () => {
    expect(isNavActive("/he", "/he", "exact")).toBe(true);
    expect(isNavActive("/he/", "/he", "exact")).toBe(true);
    expect(isNavActive("/he/patients", "/he", "exact")).toBe(false);
  });

  it("marks nested patient routes as active", () => {
    expect(isNavActive("/he/patients/abc", "/he/patients")).toBe(true);
    expect(isNavActive("/he/calendar", "/he/patients")).toBe(false);
  });

  it("resolves Hebrew page titles from the path", () => {
    expect(pageTitleFromPath("he", "/he/calendar")).toBe("יומן");
    expect(pageTitleFromPath("he", "/he")).toBe("לוח הבקרה");
  });
});
