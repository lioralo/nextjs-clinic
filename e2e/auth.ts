import { expect, type Page } from "@playwright/test";

async function hasSessionCookie(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.some((cookie) => cookie.name.includes("session-token"));
}

export async function login(page: Page) {
  await page.request.get("/api/auth/csrf");
  await page.request.get("/api/auth/session");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto("/he/login");
    await page.locator('input[name="username"]').fill("admin");
    await page.locator('input[name="password"]').fill("admin-password");
    await page.getByRole("button", { name: /התחבר/i }).click();
    await expect(page).toHaveURL(/\/he\/?$/);
    await expect(
      page.getByRole("heading", { name: /דשבורד|Dashboard/i })
    ).toBeVisible();
    try {
      await expect.poll(() => hasSessionCookie(page), { timeout: 8_000 }).toBeTruthy();
      return;
    } catch {
      // First next dev compile of NextAuth can complete the UI login without
      // persisting the session cookie. Retry after the route is warm.
    }
  }

  throw new Error("Login did not persist a NextAuth session cookie");
}
