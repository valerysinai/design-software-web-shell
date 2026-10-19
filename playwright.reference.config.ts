import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'reference-data-real.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/reference-result.json' }]],
  use: {
    baseURL: 'http://localhost:5000',
    ...devices['Desktop Chrome'],
    // Traces/HAR can contain bearer tokens, passwords and response bodies.
    trace: 'off', video: 'off', screenshot: 'only-on-failure',
  },
});
