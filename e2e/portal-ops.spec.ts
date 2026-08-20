import { test, expect, type Page } from "@playwright/test";

import { login } from "./auth";

async function waitForLoginForm(page: Page) {
  await expect(page.getByTestId("login-form")).toBeVisible({ timeout: 15_000 });
}

async function logoutToLogin(page: Page) {
  await page.getByTestId("logout").click();
  await waitForLoginForm(page);
}

async function loginPortal(page: Page) {
  await page.goto("/he/login");
  await waitForLoginForm(page);
  await page.locator('input[name="username"]').fill("portal");
  await page.locator('input[name="password"]').fill("portal-password");
  await page.getByRole("button", { name: /התחבר/i }).click();
  await expect(page.getByTestId("patient-home")).toBeVisible({ timeout: 15_000 });
}

function localInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

async function setInputValue(page: Page, locator: ReturnType<Page["locator"]>, value: string) {
  await locator.evaluate((el, next) => {
    const input = el as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
      input,
      next
    );
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

test("portal login lands on the patient home", async ({ page }) => {
  await loginPortal(page);
  await expect(page).toHaveURL(/\/he\/patient/);
  await expect(page.getByTestId("clinic-sidebar")).toHaveCount(0);
});

test("staff create resource, assign it, and patient can download", async ({
  page,
}) => {
  const title = `E2E Worksheet ${Date.now()}`;
  await login(page);
  await page.goto("/he/resources");
  await page.getByTestId("resource-title").fill(title);
  await page.getByTestId("resource-url").fill("https://example.com/worksheet.pdf");
  await page.getByTestId("create-resource").click();
  await expect(page.getByTestId("resource-title")).toHaveValue("");
  await expect(page.getByDisplayValue(title)).toBeVisible();

  await page.goto("/he/patients");
  await page.getByTestId("crm-status-ongoing").click();
  await page.getByRole("link", { name: "Test Patient" }).first().click();
  await page.getByTestId("assign-resource").selectOption({ label: title });
  await page.getByTestId("assign-resource-submit").click();

  await logoutToLogin(page);
  await loginPortal(page);
  await expect(page.getByTestId("portal-resources")).toContainText(title);
  await expect(page.getByTestId("resource-download").first()).toBeVisible();
});

test("patient message appears in staff inbox", async ({ page }) => {
  const body = `E2E portal hello ${Date.now()}`;
  await loginPortal(page);
  await page.getByTestId("portal-message-body").fill(body);
  await page.getByTestId("portal-send-message").click();
  await expect(page.getByText(body).first()).toBeVisible();

  await logoutToLogin(page);
  await login(page);
  await page.goto("/he/messages");
  const patientLink = page.getByRole("link", { name: /Test Patient/ }).first();
  if (await patientLink.isVisible().catch(() => false)) {
    await patientLink.click();
  }
  await expect(page.getByTestId("message-thread")).toContainText(body);
});

test("patient cancel request can be approved", async ({ page }) => {
  const reason = `E2E cannot attend ${Date.now()}`;
  await login(page);
  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("open-booking-panel").click();
  const start = new Date();
  start.setDate(start.getDate() + 3);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  await setInputValue(page, page.getByTestId("draft-start"), localInput(start));
  await setInputValue(page, page.getByTestId("draft-end"), localInput(end));
  await page.getByRole("checkbox", { name: /חוזר שבועית/ }).uncheck();
  await page.getByTestId("create-booking").click();
  await expect(
    page.locator(".fc-event").filter({ hasText: "Test Patient" }).first()
  ).toBeVisible({ timeout: 10_000 });

  await logoutToLogin(page);
  await loginPortal(page);
  const cancelRow = page
    .locator("li")
    .filter({ has: page.getByTestId("portal-request-cancel") })
    .last();
  await cancelRow.locator('input[name="reason"]').fill(reason);
  await cancelRow.getByTestId("portal-request-cancel").click();
  await expect(page.getByTestId("patient-home")).toBeVisible();

  await logoutToLogin(page);
  await login(page);
  await page.goto("/he/cancel-requests");
  await expect(page.getByTestId("cancel-queue")).toContainText(reason);
  await page
    .locator("li")
    .filter({ hasText: reason })
    .getByTestId("approve-cancel")
    .click();
  await expect(page.getByText(reason)).toHaveCount(0);
});

test("group sessions show on the staff week grid", async ({ page }) => {
  const groupName = `E2E Group ${Date.now()}`;
  await login(page);
  await page.goto("/he/groups");
  await page.getByTestId("group-name").fill(groupName);
  await page.getByTestId("create-group").click();
  await expect(page.getByTestId("add-group-member")).toBeVisible();
  await page.getByTestId("add-group-member").click();
  await expect(page.getByText("Test Patient").first()).toBeVisible();

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  await setInputValue(page, page.locator('input[name="startAt"]'), localInput(start));
  await setInputValue(page, page.locator('input[name="endAt"]'), localInput(end));
  await page.locator('input[name="weeks"]').fill("1");
  await page.getByTestId("create-group-sessions").click();
  await expect(page.getByTestId("group-session-row").first()).toBeVisible({
    timeout: 15_000,
  });

  await page.goto(`/he/calendar?focus=${encodeURIComponent(start.toISOString())}`);
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });
  const groupEvent = page.locator(".fc-event").filter({ hasText: groupName }).first();
  for (let i = 0; i < 3; i += 1) {
    if (await groupEvent.isVisible().catch(() => false)) break;
    await page.locator(".fc-next-button").click();
    await page.waitForTimeout(400);
  }
  await expect(groupEvent).toBeVisible({ timeout: 10_000 });
});
