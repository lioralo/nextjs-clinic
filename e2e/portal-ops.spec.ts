import { test, expect } from "@playwright/test";

import { login } from "./auth";

async function loginPortal(page: import("@playwright/test").Page) {
  await page.goto("/he/login");
  await page.locator('input[name="username"]').fill("portal");
  await page.locator('input[name="password"]').fill("portal-password");
  await page.getByRole("button", { name: /התחבר/i }).click();
  await expect(page.getByTestId("patient-home")).toBeVisible({ timeout: 15_000 });
}

test("portal login lands on the patient home", async ({ page }) => {
  await loginPortal(page);
  await expect(page).toHaveURL(/\/he\/patient/);
  await expect(page.getByTestId("clinic-sidebar")).toHaveCount(0);
});

test("staff create resource, assign it, and patient can download", async ({
  page,
}) => {
  await login(page);
  await page.goto("/he/resources");
  await page.getByTestId("resource-title").fill("E2E Worksheet");
  await page.getByTestId("resource-url").fill("https://example.com/worksheet.pdf");
  await page.getByTestId("create-resource").click();
  await expect(page.getByText("E2E Worksheet").first()).toBeVisible();

  await page.goto("/he/patients");
  await page.getByTestId("crm-status-ongoing").click();
  await page.getByRole("link", { name: "Test Patient" }).first().click();
  await page.getByTestId("assign-resource").selectOption({ label: "E2E Worksheet" });
  await page.getByTestId("assign-resource-submit").click();

  await page.getByTestId("logout").click();
  await loginPortal(page);
  await expect(page.getByTestId("portal-resources")).toContainText("E2E Worksheet");
  await expect(page.getByTestId("resource-download")).toBeVisible();
});

test("patient message appears in staff inbox", async ({ page }) => {
  await loginPortal(page);
  await page.getByTestId("portal-message-body").fill("E2E portal hello");
  await page.getByTestId("portal-send-message").click();

  await page.getByRole("button", { name: /התנתק|Log out/ }).click();
  await login(page);
  await page.goto("/he/messages");
  await expect(page.getByTestId("message-thread")).toContainText("E2E portal hello");
});

test("patient cancel request can be approved", async ({ page }) => {
  await login(page);
  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("open-booking-panel").click();
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(17, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  for (const [testId, value] of [
    ["draft-start", local(start)],
    ["draft-end", local(end)],
  ] as const) {
    await page.getByTestId(testId).evaluate((el, next) => {
      const input = el as HTMLInputElement;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
        input,
        next
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }
  await page.getByRole("checkbox", { name: /חוזר שבועית/ }).uncheck();
  await page.getByTestId("create-booking").click();
  await expect(page.locator(".fc-event").filter({ hasText: "Test Patient" }).first()).toBeVisible({
    timeout: 10_000,
  });

  await page.getByTestId("logout").click();
  await loginPortal(page);
  await page.locator('input[name="reason"]').first().fill("E2E cannot attend");
  await page.getByTestId("portal-request-cancel").first().click();

  await page.getByRole("button", { name: /התנתק|Log out/ }).click();
  await login(page);
  await page.goto("/he/cancel-requests");
  await expect(page.getByTestId("cancel-queue")).toContainText("E2E cannot attend");
  await page.getByTestId("approve-cancel").click();
  await expect(page.getByTestId("cancel-queue")).toHaveCount(0);
});

test("group sessions show on the staff week grid", async ({ page }) => {
  await login(page);
  await page.goto("/he/groups");
  await page.getByTestId("group-name").fill("E2E Group");
  await page.getByTestId("create-group").click();
  await page.getByTestId("add-group-member").click();
  await page.getByTestId("create-group-sessions").click();
  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".fc-event").filter({ hasText: "E2E Group" }).first()).toBeVisible({
    timeout: 10_000,
  });
});
