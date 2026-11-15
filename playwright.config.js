import { defineConfig } from '@playwright/test';

const remoteURL = process.env.LIVE_URL;
const baseURL = remoteURL || 'http://127.0.0.1:4173/genesis-codex-trial/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: { baseURL },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: remoteURL ? undefined : {
    command: 'node scripts/serve.js', url: baseURL, reuseExistingServer: false,
    env: { STATIC_DIR: 'dist', BASE_PATH: '/genesis-codex-trial/' },
  },
});
