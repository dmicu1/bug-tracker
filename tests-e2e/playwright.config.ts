import { defineConfig } from "@playwright/test";
import os from "node:os";
import path from "node:path";

const isCI = Boolean(process.env.CI);
const frontendURL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";
const backendURL = process.env.PLAYWRIGHT_API_BASE_URL || "http://localhost:8080";
const e2eDBPath = path.join(os.tmpdir(), `bugtracker-e2e-${process.pid}.db`);

export default defineConfig({
  testDir: ".",
  testMatch: "integration.spec.ts",
  webServer: [
    {
      command: "go run ./cmd/bugtracker",
      cwd: "../bugtracker-backend",
      env: {
        DB_PATH: e2eDBPath,
      },
      url: `${backendURL}/api/health`,
      reuseExistingServer: !isCI,
      timeout: 120000,
    },
    {
      command: "npm run dev -- --hostname localhost --port 3000",
      cwd: "../bugtracker-frontend",
      env: {
        NEXT_PUBLIC_API_URL: backendURL,
      },
      url: frontendURL,
      reuseExistingServer: !isCI,
      timeout: 120000,
    },
  ],
  use: {
    baseURL: frontendURL,
    trace: "on-first-retry",
    headless: isCI ? true : false,
    launchOptions: {
      slowMo: isCI ? 0 : 1000,
    },
  },
  timeout: 30000,
  reporter: [
    ["list"],
    ["junit", { outputFile: "test-results/results.xml" }],
    ["html", { outputFolder: "playwright-report" }],
  ]
});
