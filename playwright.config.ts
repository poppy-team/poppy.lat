import { defineConfig, devices } from '@playwright/test';

const port = 4185;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  timeout: 60_000,
  // The suite runs against a fresh build. A preview server left over from an
  // earlier run would otherwise serve stale output and quietly invalidate the
  // results, which is how the chrome regressions went unnoticed.
  webServer: {
    command: `pnpm build && npx vitepress preview site --port ${port}`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
