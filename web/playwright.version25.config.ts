import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /(version23\/clerk\.setup|version25\/version25-launch-verification\.spec)\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  globalSetup: "./e2e/version25/global-setup.ts",
  globalTeardown: "./e2e/version25/global-teardown.ts",
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/version25-results.json" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.QA_BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "clerk-setup",
      testMatch: /version23\/clerk\.setup\.ts/,
    },
    {
      name: "version25-launch",
      testMatch: /version25\/version25-launch-verification\.spec\.ts/,
      dependencies: ["clerk-setup"],
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
      },
    },
  ],
});
