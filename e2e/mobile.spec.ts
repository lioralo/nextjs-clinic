import { devices, expect, test } from "@playwright/test";

import { login } from "./auth";

test.use({
  ...devices["iPhone 13"],
});

test("mobile login form fits the viewport", async ({ page }) => {
  await page.goto("/he/login");
  await expect(page.getByTestId("login-form")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  const viewport = page.viewportSize();
  const box = await page.getByTestId("login-form").boundingBox();
  expect(viewport).toBeTruthy();
  expect(box).toBeTruthy();
  expect(box!.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
});

test("mobile staff chrome: drawer, RTL, calendar time-grid", async ({
  page,
}) => {
  await login(page);

  const menu = page.getByTestId("open-menu");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "false");

  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("navigation", { name: /ניווט ראשי/ })
    .getByRole("link", { name: /^יומן$/ })
    .click();

  await expect(page).toHaveURL(/\/he\/calendar/);
  await expect(page.getByTestId("clinic-calendar")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator(".fc")).toBeVisible();
  await expect(page.locator(".fc-timegrid")).toBeVisible();
  await expect(page.getByTestId("open-menu")).toBeVisible();
  await expect(page.getByTestId("open-menu")).toHaveAttribute(
    "aria-expanded",
    "false"
  );

  await page.getByTestId("open-booking-panel").click();
  await expect(page.getByTestId("booking-panel")).toBeVisible();
});
