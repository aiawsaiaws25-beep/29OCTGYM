import { defineConfig, devices } from '@playwright/test'

const WEB_PORT = 5175
const API_PORT = 3101
const E2E_ENV = {
  ...process.env,
  API_PORT: String(API_PORT),
  DATABASE_URL: '',
  PGLITE_DIR: 'memory://', // throwaway database: real data is never touched
  JWT_SECRET: 'pulsefit-e2e-secret-not-for-production-0123456789abcdef',
}

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-13', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  webServer: [
    {
      command: 'node server/dev-api.js',
      url: `http://localhost:${API_PORT}/api/stats`,
      env: E2E_ENV,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: E2E_ENV,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
