import { Page } from 'playwright-chromium'

declare global {
  // injected by the custom jest env in scripts/jestEnv.js
  const page: Page
  const __viteTestDir__: string
}
