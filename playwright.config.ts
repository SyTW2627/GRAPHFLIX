import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false, // Evita colisiones en base de datos de test
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173', // Puerto por defecto de Vite
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Levanta Backend (puerto 3000) y Frontend (puerto 5173) automáticamente
  webServer: [
    {
      command: 'bun --cwd server --env-file=.env.test run index.ts',
      url: 'http://localhost:3000', // Cambia a un endpoint de healthcheck si tienes uno
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
    },
    {
      command: 'bun --cwd client run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
    },
  ],
});