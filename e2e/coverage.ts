import { test as base, expect } from '@playwright/test';
import MCR from 'monocart-coverage-reports';

const mcr = MCR({
  name: 'Graphflix E2E Coverage',
  outputDir: './coverage-e2e',
  reports: ['v8', 'console-summary'],
  sourceFilter: (sourcePath) =>
    !sourcePath.includes('node_modules') &&
    !sourcePath.includes('.vite') &&
    !sourcePath.includes('/deps/'),
});

export const test = base.extend<{ autoCoverage: void }>({
  autoCoverage: [
    async ({ page }, use) => {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await use();
      const jsCoverage = await page.coverage.stopJSCoverage();
      await mcr.add(jsCoverage);
    },
    { auto: true },
  ],
});

export { expect };