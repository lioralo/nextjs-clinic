import { test, expect, type Page } from "@playwright/test";

import { login } from "./auth";
import { prisma } from "../src/lib/prisma";

async function openCalendar(page: Page) {
  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(".fc-timegrid")).toBeVisible();
  await page.request.get("/api/calendar");
}

async function openBookingPanel(page: Page) {
  if (await page.getByTestId("booking-panel").isVisible().catch(() => false)) {
    return;
  }
  await page.getByTestId("open-booking-panel").click();
  await expect(page.getByTestId("booking-panel")).toBeVisible();
}

async function closeBookingPanel(page: Page) {
  if (!(await page.getByTestId("booking-panel").isVisible().catch(() => false))) {
    return;
  }
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("booking-panel")).toHaveCount(0);
}

function localInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function slotOn(dayOffset: number, hour: number) {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

async function setDraftTimes(page: Page, start: Date, end: Date) {
  for (const [testId, value] of [
    ["draft-start", localInput(start)],
    ["draft-end", localInput(end)],
  ] as const) {
    await page.getByTestId(testId).evaluate((el, next) => {
      const input = el as HTMLInputElement;
      const descriptor = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      );
      descriptor?.set?.call(input, next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  }
}

async function fillVacancyDraft(page: Page, title: string, slot: { start: Date; end: Date }) {
  await openBookingPanel(page);
  const panel = page.getByTestId("booking-panel");
  await panel.locator("select").first().selectOption("VACANCY");
  await page.getByRole("checkbox", { name: /חוזר שבועית/ }).uncheck();
  await page.getByTestId("draft-title").fill(title);
  await setDraftTimes(page, slot.start, slot.end);
}

test.beforeAll(async () => {
  await prisma.appointment.deleteMany();
  await prisma.note.deleteMany({
    where: {
      patient: {
        NOT: { AND: [{ firstName: "Test" }, { lastName: "Patient" }] },
      },
    },
  });
  await prisma.patient.deleteMany({
    where: {
      NOT: { AND: [{ firstName: "Test" }, { lastName: "Patient" }] },
    },
  });
});

test("unauthenticated staff routes show a standalone login page", async ({
  page,
}) => {
  await page.request.get("/api/auth/csrf");
  await page.request.get("/api/auth/session");
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.context().clearCookies();
    await page.goto("/he");
    if (/\/he\/login/.test(page.url())) break;
  }
  await expect(page).toHaveURL(/\/he\/login/);
  await expect(page.getByTestId("login-page")).toBeVisible();
  await expect(page.getByTestId("login-form")).toBeVisible();
  await expect(page.getByTestId("clinic-sidebar")).toHaveCount(0);
});

test("logout returns to the standalone login page", async ({ page }) => {
  await login(page);
  await page.getByTestId("logout").click();
  await expect(page).toHaveURL(/\/he\/login/);
  await expect(page.getByTestId("login-page")).toBeVisible();
  await expect(page.getByTestId("clinic-sidebar")).toHaveCount(0);
});

test("overlapping vacancy is rejected and a vacancy can be occupied", async ({
  page,
}) => {
  await login(page);
  await openCalendar(page);

  const slot = slotOn(1, 10);
  await fillVacancyDraft(page, "E2E Vacancy Occupy", slot);
  await page.getByTestId("create-booking").click();
  await expect(
    page.locator(".fc-event").filter({ hasText: "E2E Vacancy Occupy" })
  ).toBeVisible({
    timeout: 10_000,
  });

  await fillVacancyDraft(page, "E2E Vacancy Occupy", slot);
  await page.getByTestId("create-booking").click();
  await expect(page.getByTestId("calendar-error")).toBeVisible();

  await closeBookingPanel(page);
  await page
    .locator(".fc-event")
    .filter({ hasText: "E2E Vacancy Occupy" })
    .click();
  await expect(page.getByTestId("occupy-vacancy")).toBeVisible();
  await page.getByTestId("occupy-vacancy").click();
  await expect(page.getByTestId("occupy-vacancy")).toHaveCount(0, {
    timeout: 10_000,
  });
  await expect(
    page.locator(".fc-event").filter({ hasText: "Test Patient" }).first()
  ).toBeVisible();
});

test("deleting this occurrence leaves the rest of the series", async ({
  page,
}) => {
  await login(page);
  await openCalendar(page);

  const slot = slotOn(1, 13);
  await openBookingPanel(page);
  const panel = page.getByTestId("booking-panel");
  await panel.locator("select").first().selectOption("APPOINTMENT");
  await page.getByRole("checkbox", { name: /חוזר שבועית/ }).check();
  await setDraftTimes(page, slot.start, slot.end);
  await page.getByTestId("create-booking").click();
  await expect(
    page.locator(".fc-event").filter({ hasText: "Test Patient" }).first()
  ).toBeVisible({
    timeout: 10_000,
  });

  await page
    .locator(".fc-event")
    .filter({ hasText: "Test Patient" })
    .first()
    .click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("delete-this-occurrence").click();
  await expect(page.getByTestId("delete-this-occurrence")).toHaveCount(0, {
    timeout: 10_000,
  });

  await page.locator(".fc-next-button").click();
  await expect(
    page.locator(".fc-event").filter({ hasText: "Test Patient" }).first()
  ).toBeVisible();
});

test("publishing vacant slots shows them on the week grid", async ({
  page,
}) => {
  await login(page);
  await openCalendar(page);
  await page.getByTestId("copy-public-booking-link").click();
  const form = page.getByTestId("publish-vacancies-form");
  await expect(form).toBeVisible();
  await form.locator('input[name="title"]').fill("E2E Published Vacancy");
  await form.locator('input[name="startTime"]').fill("11:00");
  await form.locator('input[name="startTime"]').evaluate((el, next) => {
    const input = el as HTMLInputElement;
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    );
    descriptor?.set?.call(input, next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, "11:00");
  await page.getByTestId("publish-vacancies").click();
  await expect(page.getByTestId("public-booking-url")).toBeVisible();
  const published = page
    .locator(".fc-event")
    .filter({ hasText: "E2E Published Vacancy" })
    .first();
  if (!(await published.isVisible().catch(() => false))) {
    await page.locator(".fc-next-button").click();
  }
  await expect(published).toBeVisible({ timeout: 10_000 });
});

test("patient meetings open the focused calendar", async ({ page }) => {
  await login(page);
  await openCalendar(page);
  const slot = slotOn(1, 15);
  await openBookingPanel(page);
  await setDraftTimes(page, slot.start, slot.end);
  await page.getByTestId("create-booking").click();
  await expect(
    page.locator(".fc-event").filter({ hasText: "Test Patient" }).first()
  ).toBeVisible({ timeout: 10_000 });

  await page.goto("/he/patients");
  await page.getByTestId("crm-status-ongoing").click();
  await page.getByRole("link", { name: "Test Patient" }).first().click();
  await expect(page.getByTestId("patient-meetings")).toBeVisible();
  await page.getByTestId("patient-meetings").locator("a").first().click();
  await expect(page).toHaveURL(/patientId=/);
  await expect(page.getByTestId("clinic-calendar")).toBeVisible();
  const focusedId = new URL(page.url()).searchParams.get("patientId");
  expect(focusedId).toBeTruthy();
  await openBookingPanel(page);
  await expect(page.getByTestId("draft-patient")).toHaveValue(focusedId!);
});

test("guest can book a public vacancy without logging in", async ({
  page,
  browser,
}) => {
  await login(page);
  await openCalendar(page);

  const slot = slotOn(1, 16);
  await fillVacancyDraft(page, "E2E Public Slot", slot);
  await page.getByTestId("create-booking").click();
  await expect(
    page.locator(".fc-event").filter({ hasText: "E2E Public Slot" })
  ).toBeVisible({
    timeout: 10_000,
  });

  await page.getByTestId("copy-public-booking-link").click();
  const form = page.getByTestId("publish-vacancies-form");
  for (const box of await form.locator('input[name="weekday"]').all()) {
    await box.uncheck();
  }
  await page.getByTestId("publish-vacancies").click();
  const url = await page.getByTestId("public-booking-url").innerText();
  expect(url).toContain("/he/book/");

  const guestName = `Public Guest ${Date.now()}`;
  const guest = await browser.newPage();
  await guest.goto(url);
  await expect(guest.getByTestId("public-book-form")).toBeVisible();
  await guest
    .locator("label")
    .filter({ hasText: "E2E Public Slot" })
    .locator('input[type="radio"]')
    .first()
    .check();
  await guest.locator('input[name="name"]').fill(guestName);
  await guest.locator('input[name="phone"]').fill("0501112222");
  await guest.getByRole("button", { name: /קבע משבצת/ }).click();
  await expect(guest.getByTestId("public-book-success")).toBeVisible();
  await guest.close();

  await page.goto("/he/patients?status=candidate");
  await expect(page.getByText(guestName).first()).toBeVisible();
});
