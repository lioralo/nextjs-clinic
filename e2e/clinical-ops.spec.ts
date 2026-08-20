import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";

import { login } from "./auth";
import { prisma } from "../src/lib/prisma";

test.beforeAll(async () => {
  const patient = await prisma.patient.findFirst({
    where: { firstName: "Test", lastName: "Patient" },
  });
  if (!patient) return;
  const existing = await prisma.user.findUnique({ where: { username: "portal" } });
  if (!existing) {
    await prisma.user.create({
      data: {
        username: "portal",
        passwordHash: await bcrypt.hash("portal-password", 12),
        role: "PATIENT",
        patientId: patient.id,
        email: patient.email,
        forcePasswordChange: false,
        isActive: true,
      },
    });
  }
});

test("public contact form reaches the staff inquiry list", async ({ page }) => {
  const message = `E2E inquiry ${Date.now()}`;
  await page.goto("/he/contact");
  await page.getByTestId("contact-name").fill("E2E Guest");
  await page.getByTestId("contact-email").fill("guest@example.com");
  await page.getByTestId("contact-message").fill(message);
  await page.getByTestId("contact-submit").click();
  await expect(page.getByTestId("contact-success")).toBeVisible();

  await login(page);
  await page.goto("/he/inquiries");
  await expect(page.getByTestId("inquiry-list")).toContainText(message);
});

test("staff can create a shared treatment plan, take PHQ-9, and portal sees the plan", async ({
  page,
}) => {
  await login(page);
  await page.goto("/he/patients");
  await page.getByTestId("crm-status-ongoing").click();
  await page.getByRole("link", { name: "Test Patient" }).first().click();
  await page.getByRole("link", { name: /טיפול|Care/ }).click();
  await page.getByTestId("plan-diagnosis").fill("E2E GAD");
  await page.getByTestId("plan-goal").fill("Sleep 7 hours");
  await page.getByTestId("create-plan").click();
  await expect(page.getByTestId("treatment-plans")).toContainText("E2E GAD");

  await page.getByTestId("assessment-type").selectOption("PHQ-9");
  for (let index = 0; index < 9; index += 1) {
    await page.locator(`input[name="q_${index}"][value="0"]`).check();
  }
  await page.getByTestId("submit-assessment").click();
  await expect(page.getByTestId("assessment-result").first()).toContainText("PHQ-9");

  await page.getByTestId("logout").click();
  await expect(page.getByTestId("login-form")).toBeVisible({ timeout: 15_000 });
  await page.goto("/he/login");
  await expect(page.getByTestId("login-form")).toBeVisible();
  await page.locator('input[name="username"]').fill("portal");
  await page.locator('input[name="password"]').fill("portal-password");
  await expect(page.locator('input[name="username"]')).toHaveValue("portal");
  await page.getByRole("button", { name: /התחבר/i }).click();
  await expect(page.getByTestId("patient-home")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("portal-plans")).toContainText("E2E GAD");
});

test("settings page can start authenticator setup", async ({ page }) => {
  await login(page);
  await page.goto("/he/settings");
  await page.getByTestId("totp-start").click();
  await expect(page.getByTestId("totp-qr")).toBeVisible();
});
