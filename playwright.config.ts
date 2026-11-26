import fs from 'node:fs';
import { defineConfig } from '@playwright/test';

const chromeExePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgeExePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const resolvedExe = fs.existsSync(chromeExePath)
  ? chromeExePath
  : fs.existsSync(edgeExePath)
    ? edgeExePath
    : undefined;

const E2E_API_PORT = process.env.E2E_API_PORT || '5099';
const E2E_UI_PORT = process.env.E2E_UI_PORT || '5174';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${E2E_UI_PORT}`,
    trace: 'on-first-retry',
    launchOptions: {
      ...(resolvedExe ? { executablePath: resolvedExe } : {}),
      args: [
        '--no-proxy-server',
        '--disable-background-networking',
        '--disable-extensions',
        '--disable-sync',
        '--disable-gpu',
      ],
    },
  },
  webServer: [
    {
      command: 'node -r ts-node/register/transpile-only __tests__/helpers/e2eServer.ts',
      cwd: './server',
      url: `http://127.0.0.1:${E2E_API_PORT}/health-check`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        NODE_ENV: 'test',
        E2E_API_PORT,
        TS_NODE_PROJECT: './tsconfig.json',
      },
    },
    {
      command: `node ./node_modules/vite/bin/vite.js build --outDir node_modules/.cache/e2e-dist && node ./node_modules/vite/bin/vite.js preview --outDir node_modules/.cache/e2e-dist --host 127.0.0.1 --port ${E2E_UI_PORT} --strictPort`,
      url: `http://127.0.0.1:${E2E_UI_PORT}/`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: `http://127.0.0.1:${E2E_API_PORT}/api`,
        VITE_SOCKET_URL: `http://127.0.0.1:${E2E_API_PORT}`,
      },
    },
  ],
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
