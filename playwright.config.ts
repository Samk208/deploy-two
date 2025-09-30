import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/e2e/**/*.spec.ts'],
  timeout: 45_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '50%' : undefined,
  reporter: [
    ['list'],
    // Save reports to the requested Windows path with spaces
    ['json', { outputFile: 'test-results/Shops Reports/New Shop Report/results.json' }],
    ['html', { outputFolder: 'test-results/Shops Reports/New Shop Report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  // Artifacts (traces, screenshots, videos)
  outputDir: 'test-results/Shops Reports/New Shop Report/artifacts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './tests/setup/global-setup.ts',
  // Run tests against a dedicated dev server port to avoid EADDRINUSE when a local dev server is already running.
  // We choose 3001 here to minimize collisions with manual local runs on 3000.
  webServer: {
    command: 'pnpm dev --port 3001',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
