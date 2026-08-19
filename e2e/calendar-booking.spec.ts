import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/he/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("admin-password");
  await page.getByRole("button", { name: /התחבר/i }).click();
  await expect(page).toHaveURL(/\/he\/?$/);
}

function localInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function clinicSlot(hour: number, dayOffset = 0) {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

test("overlapping vacancy is rejected and a vacancy can be occupied", async ({
  page,
}) => {
  await login(page);
  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });

  const slot = clinicSlot(11, 1);
  const panel = page.getByTestId("booking-panel");
  await panel.locator("select").first().selectOption("VACANCY");
  await page.getByTestId("draft-start").fill(localInput(slot.start));
  await page.getByTestId("draft-end").fill(localInput(slot.end));
  await page.getByTestId("create-booking").click();
  await expect(page.locator(".fc-kind-vacancy").first()).toBeVisible({
    timeout: 10_000,
  });

  await panel.locator("select").first().selectOption("VACANCY");
  await page.getByTestId("draft-start").fill(localInput(slot.start));
  await page.getByTestId("draft-end").fill(localInput(slot.end));
  await page.getByTestId("create-booking").click();
  await expect(page.getByTestId("calendar-error")).toBeVisible();

  await page.locator(".fc-kind-vacancy").first().click();
  await expect(page.getByTestId("occupy-vacancy")).toBeVisible();
  await page.getByTestId("occupy-vacancy").click();
  await expect(page.getByTestId("occupy-vacancy")).toHaveCount(0);
});

test("deleting this occurrence leaves the rest of the series", async ({
  page,
}) => {
  await login(page);
  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });

  const slot = clinicSlot(15, 1);
  const panel = page.getByTestId("booking-panel");
  await panel.locator("select").first().selectOption("APPOINTMENT");
  await page.getByTestId("draft-start").fill(localInput(slot.start));
  await page.getByTestId("draft-end").fill(localInput(slot.end));
  await page.getByLabel(/חוזר שבועית/).check();
  await page.getByTestId("create-booking").click();
  await expect(page.getByText("Test Patient").first()).toBeVisible({
    timeout: 10_000,
  });

  await page.locator(".fc-kind-appointment").first().click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByTestId("delete-this-occurrence").click();
  await expect(page.getByTestId("delete-this-occurrence")).toHaveCount(0);

  await page.locator(".fc-next-button").click();
  await expect(page.getByText("Test Patient").first()).toBeVisible();
});

test("guest can book a public vacancy without logging in", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.goto("/he/calendar");
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });

  const slot = clinicSlot(16, 2);
  const panel = page.getByTestId("booking-panel");
  await panel.locator("select").first().selectOption("VACANCY");
  await page.getByTestId("draft-start").fill(localInput(slot.start));
  await page.getByTestId("draft-end").fill(localInput(slot.end));
  await page.getByTestId("create-booking").click();
  await expect(page.locator(".fc-kind-vacancy").first()).toBeVisible({
    timeout: 10_000,
  });

  await page.getByTestId("copy-public-booking-link").click();
  const url = await page.getByTestId("public-booking-url").innerText();
  expect(url).toContain("/he/book/");

  const guest = await browser.newPage();
  await guest.goto(url);
  await expect(guest.getByTestId("public-book-form")).toBeVisible();
  await guest.locator('input[name="vacancyEventId"]').first().check();
  await guest.locator('input[name="name"]').fill("Public Guest");
  await guest.locator('input[name="phone"]').fill("0501112222");
  await guest.getByRole("button", { name: /קבע משבצת/ }).click();
  await expect(guest.getByTestId("public-book-success")).toBeVisible();
  await guest.close();

  await page.goto("/he/patients?status=candidate");
  await expect(page.getByText("Public Guest")).toBeVisible();
});
