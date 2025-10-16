import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/e2e/**/*readonly.spec.ts"],
  timeout: 45_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? "50%" : undefined,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "dashboard-build/html-report",
        open: "never",
      },
    ],
    [
      "json",
      {
        outputFile: "dashboard-build/test-results.json",
      },
    ],
    [
      "junit",
      {
        outputFile: "dashboard-build/junit-results.xml",
      },
    ],
  ],
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
  },
  outputDir: "dashboard-build/test-artifacts",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  globalSetup: "./tests/setup/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  webServer: {
    // Inherit freeze envs from the parent process; they are set in the npm script
    command: "pnpm dev --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
