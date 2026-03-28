import { defineConfig, devices } from "@playwright/test"

const useExistingServer = process.env.PLAYWRIGHT_USE_EXISTING_SERVER === "1"

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testMatch: /.*\.playwright\.ts$/,
  testDir: "./e2e-playwright",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:4010",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry"
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: useExistingServer
    ? undefined
    : {
        command: "PORT=4010 bun run dev:frontend",
        url: "http://localhost:4010",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000
      }
})
