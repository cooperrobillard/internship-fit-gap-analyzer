import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/version23",
  testMatch: /(clerk\.setup|auth-smoke)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.QA_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "clerk-setup",
      testMatch: /clerk\.setup\.ts/,
    },
    {
      name: "auth-smoke-handoff",
      testMatch: /auth-smoke-handoff\.spec\.ts/,
    },
    {
      name: "auth-smoke",
      testMatch: /auth-smoke\.spec\.ts/,
      dependencies: ["clerk-setup"],
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
      },
    },
  ],
});
