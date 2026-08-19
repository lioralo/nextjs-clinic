import { defineConfig, devices } from "@playwright/test";

const nextBaseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  retries: 0,
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,

  use: {
    baseURL: nextBaseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },

  webServer: {
    command: "npm run dev",
    url: nextBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
