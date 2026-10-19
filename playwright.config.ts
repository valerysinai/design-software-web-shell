import { defineConfig, devices } from '@playwright/test';

/**
 * E5 (ADR-009 §11.2): smoke test en navegador real.
 *
 * A diferencia de Vitest/jsdom, Playwright ejecuta el `remoteEntry.js` en un navegador,
 * que es la unica forma de verificar que un remote monta con el React compartido
 * ("Invalid hook call" en E4).
 *
 * El `webServer` levanta el shell en modo federation. Los remotes deben estar
 * levantados aparte (5101-5109); los que no respondan se esperan como caidos.
 */
const SHELL_PORT = 5000;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: process.env['CI'] === 'true',
  retries: process.env['CI'] === 'true' ? 1 : 0,
  workers: 1,
  reporter: process.env['CI'] === 'true' ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: `http://localhost:${SHELL_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${SHELL_PORT}`,
    reuseExistingServer: process.env['CI'] !== 'true',
    timeout: 120_000,
    env: {
      // El smoke test existe para probar remotes reales, no stubs.
      VITE_REMOTE_SOURCE: 'federation',
    },
  },
});