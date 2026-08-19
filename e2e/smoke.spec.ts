import { test, expect } from "@playwright/test";

test("login as admin and loads seeded patients", async ({ page }) => {
  await page.goto("/he/login");

  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("admin-password");

  await page.getByRole("button", { name: /התחבר/i }).click();

  // Should land on /he (dashboard) after successful credentials login.
  await expect(page).toHaveURL(/\/he\/?$/);

  await page.goto("/he/patients");

  // Seeded sample patient (see prisma/seed.ts).
  await expect(page.getByText("Test Patient")).toBeVisible();
});

test("patient notes save and calendar week grid is visible", async ({
  page,
}) => {
  await page.goto("/he/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("admin-password");
  await page.getByRole("button", { name: /התחבר/i }).click();
  await expect(page).toHaveURL(/\/he\/?$/);

  await page.goto("/he/patients");
  await page.getByRole("link", { name: "Test Patient" }).first().click();

  await expect(page.getByRole("heading", { name: "Test Patient" })).toBeVisible();

  const notesForm = page.getByTestId("patient-notes-form");
  await notesForm.locator('textarea[name="content"]').fill(
    "Follow-up note from e2e"
  );
  await notesForm.getByRole("button", { name: /שמור רשומת מפגש/i }).click();
  await expect(page.getByText("Follow-up note from e2e")).toBeVisible();

  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(".fc")).toBeVisible();
  await expect(page.locator(".fc-timegrid")).toBeVisible();
});
