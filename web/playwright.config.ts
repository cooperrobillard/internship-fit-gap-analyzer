import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e/version23",
  testMatch: /version23-data-controls\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  globalSetup: "./e2e/version23/global-setup.ts",
  globalTeardown: "./e2e/version23/global-teardown.ts",
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["json", { outputFile: "test-results/version23-results.json" }], ["list"]],
  use: { baseURL: process.env.QA_BASE_URL, trace: "retain-on-failure", video: "off", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], browserName: "chromium" } }],
});
