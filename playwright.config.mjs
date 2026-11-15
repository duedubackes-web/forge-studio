import { defineConfig } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/browser.spec.mjs",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4174",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node src/server.mjs",
    url: "http://127.0.0.1:4174/api/health",
    reuseExistingServer: false,
    env: {
      PORT: "4174",
      FORGE_DATA_PATH: join(tmpdir(), `forge-e2e-${randomUUID()}.json`),
    },
  },
});
