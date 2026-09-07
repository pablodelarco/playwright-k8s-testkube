import { defineConfig } from '@playwright/test';

// WORKERS is the number of browser contexts per shard (per pod).
// Keep it low: each Chromium process costs memory, and memory is
// what limits how many shards fit on a node.
const workers = Number(process.env.WORKERS || 2);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers,
  retries: 0,
  timeout: 30_000,
  reporter: process.env.CI ? [['blob'], ['line']] : [['line']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: 'off',
    // Kubernetes gives containers a 64 MB /dev/shm by default. Chromium
    // uses it for shared memory and crashes when it fills, so tell it to
    // use /tmp instead. Same fix as --ipc=host in plain Docker.
    launchOptions: { args: ['--disable-dev-shm-usage'] },
  },
  webServer: {
    command: 'node app/server.js',
    url: 'http://127.0.0.1:4173/catalog/1',
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
