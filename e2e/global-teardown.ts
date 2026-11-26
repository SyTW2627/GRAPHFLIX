import MCR from 'monocart-coverage-reports';

export default async function globalTeardown() {
  const mcr = MCR({
    name: 'Graphflix E2E Coverage',
    outputDir: './coverage-e2e',
    reports: ['v8', 'console-summary'],
    sourceFilter: (sourcePath) =>
      !sourcePath.includes('node_modules') &&
      !sourcePath.includes('.vite') &&
      !sourcePath.includes('/deps/'),
  });
  await mcr.generate();
}