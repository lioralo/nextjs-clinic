import { expect, type Page } from "@playwright/test";

export async function login(page: Page) {
  await page.request.get("/api/auth/session");
  await page.goto("/he/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill("admin-password");
  await page.getByRole("button", { name: /התחבר/i }).click();
  await expect(page).toHaveURL(/\/he\/?$/);
  await expect(
    page.getByRole("heading", { name: /דשבורד|Dashboard/i })
  ).toBeVisible();
  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();
      return cookies.some((cookie) => cookie.name.includes("session-token"));
    })
    .toBeTruthy();
}
