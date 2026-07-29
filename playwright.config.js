// Playwright configuration for Engineering ML Studio baseline tests.
// The application is a static site; we serve it with Python's built-in HTTP
// server (already required for local development) and drive it in Chromium.
const { defineConfig, devices } = require('@playwright/test');

const PORT = process.env.EMS_TEST_PORT || 8000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

module.exports = defineConfig({
  testDir: './tests',
  // Baseline model training runs in the browser and can take a few seconds.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // Force bundled libraries (no CDN) so tests are deterministic and offline.
    // Individual tests navigate to '/?localOnly=1'.
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
