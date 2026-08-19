import { test, expect, type Page } from "@playwright/test";

import { prisma } from "../src/lib/prisma";

async function login(page: Page) {
  await page.goto("/he/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("admin-password");
  await page.getByRole("button", { name: /התחבר/i }).click();
  await expect(page).toHaveURL(/\/he\/?$/);
  await expect(
    page.getByRole("heading", { name: /דשבורד|Dashboard/i })
  ).toBeVisible();
}

async function openCalendar(page: Page) {
  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(".fc-timegrid")).toBeVisible();
  await page.request.get("/api/calendar");
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
