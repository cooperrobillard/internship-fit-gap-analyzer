import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e/version23",
  testMatch: /(clerk\.setup|version23-data-controls)\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  globalSetup: "./e2e/version23/global-setup.ts",
  globalTeardown: "./e2e/version23/global-teardown.ts",
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/version23-results.json" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.QA_BASE_URL,
    trace: "retain-on-failure",
    video: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "clerk-setup",
      testMatch: /clerk\.setup\.ts/,
    },
    {
      name: "version23-qa",
      testMatch: /version23-data-controls\.spec\.ts/,
      dependencies: ["clerk-setup"],
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium",
      },
    },
  ],
});
