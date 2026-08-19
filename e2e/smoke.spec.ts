import { test, expect } from "@playwright/test";

test("login as admin and loads seeded patients", async ({ page }) => {
  await page.goto("/he/login");

  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("admin-password");

  await page.getByRole("button", { name: /התחבר/i }).click();

  await expect(page).toHaveURL(/\/he\/?$/);

  await page.goto("/he/patients");
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
  await page.getByTestId("crm-status-ongoing").click();
  await expect(page.getByText("Test Patient")).toBeVisible();
  await page.getByRole("link", { name: "Test Patient" }).first().click();

  await expect(page.getByRole("heading", { name: "Test Patient" })).toBeVisible();
  await page.getByRole("link", { name: /יומני מפגש/i }).click();

  const notesForm = page.getByTestId("patient-notes-form");
  const noteText = `Follow-up note from e2e ${Date.now()}`;
  await notesForm.locator('input[name="sessionNumber"]').fill("1");
  await notesForm.locator('textarea[name="content"]').fill(noteText);
  await notesForm.getByRole("button", { name: /הוסף יומן מפגש/i }).click();
  await expect(page.getByText(noteText)).toBeVisible();
  await expect(page.getByText(/מפגש 1/).first()).toBeVisible();

  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("booking-panel")).toBeVisible();
  await expect(page.locator(".fc")).toBeVisible();
  await expect(page.locator(".fc-timegrid")).toBeVisible();
  await page.screenshot({
    path: "test-results/calendar-week.png",
    fullPage: true,
  });
});
