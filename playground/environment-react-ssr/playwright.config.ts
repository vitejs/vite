import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.E2E_PORT || 6174)
const isPreview = Boolean(process.env.E2E_PREVIEW)
const command = isPreview
  ? `pnpm preview --port ${port} --strict-port`
  : `pnpm dev --port ${port} --strict-port`

export default defineConfig({
  testDir: '__tests__',
  testMatch: [/.*\.playwright\.ts/],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
  webServer: {
    command,
    port,
  },
  forbidOnly: !!process.env['CI'],
  reporter: 'list',
})
