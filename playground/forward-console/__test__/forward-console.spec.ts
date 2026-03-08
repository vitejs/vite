import { stripVTControlCharacters } from 'node:util'
import { expect, test } from 'vitest'
import { isServe, page, serverLogs, viteTestUrl } from '~utils'

function normalizeLogs(logs: string[]) {
  return (
    logs
      .map((log) => stripVTControlCharacters(log))
      .join('\n')
      // normalize .pnpm path
      .replaceAll(
        /node_modules\/\.pnpm\/[^/\n]+\/node_modules\//g,
        'node_modules/.pnpm/<normalized>/node_modules/',
      )
      // strip trailing spaces of code frame
      .replaceAll(/ +\n/g, '\n')
  )
}

test.runIf(isServe)('unhandled error', async () => {
  await page.click('#test-error')
  await expect.poll(() => normalizeLogs(serverLogs)).toContain(`\
[Unhandled error] Error: this is test error
 > testError src/main.ts:36:8
    34 |
    35 |  function testError() {
    36 |    throw new Error('this is test error')
       |          ^
    37 |  }
    38 |
 > HTMLButtonElement.<anonymous> src/main.ts:8:2
`)
})

test.runIf(isServe)('unhandled rejection', async () => {
  const logIndex = serverLogs.length
  await page.click('#test-unhandledrejection')
  await expect.poll(() => normalizeLogs(serverLogs.slice(logIndex)))
    .toContain(`\
[Unhandled rejection] Error: this is test unhandledrejection
 > testUnhandledRejection src/main.ts:40:17
    38 |
    39 |  function testUnhandledRejection() {
    40 |    Promise.reject(new Error('this is test unhandledrejection'))
       |                   ^
    41 |  }
    42 |
 > HTMLButtonElement.<anonymous> src/main.ts:14:4
`)
})

test.runIf(isServe)('console.error', async () => {
  const logIndex = serverLogs.length
  await page.click('#test-console-error')
  await expect
    .poll(() => normalizeLogs(serverLogs.slice(logIndex)))
    .toContain(
      `[console.error] format: string=hello number=12.9 int=42 float=3.5 json={"id":1} object={"enabled":true} object2={"nested":{"deep":1}} style= literal=% trailing done`,
    )
})

test.runIf(isServe)('dependency stack uses source map path', async () => {
  const logIndex = serverLogs.length
  await page.click('#test-dep-error')
  await expect.poll(() => normalizeLogs(serverLogs.slice(logIndex)))
    .toContain(`\
[Unhandled error] Error: this is test dependency error
 > throwDepError ../../node_modules/.pnpm/<normalized>/node_modules/@vitejs/test-forward-console-throw-dep/index.js:2:8
 > testDepError src/main.ts:44:2
    42 |
    43 |  function testDepError() {
    44 |    throwDepError()
       |    ^
    45 |  }
    46 |
 > HTMLButtonElement.<anonymous> src/main.ts:22:2
`)
})

// runtime overlay tests (hmr.runtimeErrors: true)
async function getOverlayShadowText(selector: string): Promise<string> {
  return page.evaluate((sel) => {
    const overlay = document.querySelector('vite-error-overlay')
    return overlay?.shadowRoot?.querySelector(sel)?.textContent?.trim() ?? ''
  }, selector)
}

async function getOverlayBorderColor(): Promise<string> {
  return page.evaluate(() => {
    const overlay = document.querySelector('vite-error-overlay')
    const win = overlay?.shadowRoot?.querySelector(
      '.window',
    ) as HTMLElement | null
    return win ? getComputedStyle(win).borderTopColor : ''
  })
}

test.runIf(isServe)(
  'runtime overlay: toast appears on uncaught error',
  async () => {
    await page.goto(viteTestUrl)
    await page.click('#test-runtime-overlay')
    await expect
      .poll(() => page.locator('vite-runtime-errors-toast').count())
      .toBeGreaterThan(0)
    const toastText = await page.evaluate(() => {
      const toast = document.querySelector('vite-runtime-errors-toast')
      return toast?.shadowRoot?.querySelector('.issue-text')?.textContent ?? ''
    })
    expect(toastText).toMatch(/1 Issue/)
  },
)

test.runIf(isServe)(
  'runtime overlay: clicking toast opens sourcemap-resolved overlay',
  async () => {
    await page.goto(viteTestUrl)
    await page.click('#test-runtime-overlay')
    await page.waitForSelector('vite-runtime-errors-toast')
    await page.evaluate(() => {
      const toast = document.querySelector('vite-runtime-errors-toast')
      const toastEl = toast?.shadowRoot?.querySelector(
        '.runtime-toast',
      ) as HTMLElement | null
      toastEl?.click()
    })
    await page.waitForSelector('vite-error-overlay')

    const message = await getOverlayShadowText('.message-body')
    expect(message).toContain('this is runtime overlay error')

    const stack = await getOverlayShadowText('.stack')
    expect(stack).toMatch(/src\/main\.ts/)

    const frame = await getOverlayShadowText('.frame')
    expect(frame).toContain('testRuntimeOverlay')
  },
)

test.runIf(isServe)(
  'runtime overlay: overlay uses yellow border for runtime errors',
  async () => {
    await page.goto(viteTestUrl)
    await page.click('#test-runtime-overlay')
    await page.waitForSelector('vite-runtime-errors-toast')
    await page.evaluate(() => {
      const toast = document.querySelector('vite-runtime-errors-toast')
      const toastEl = toast?.shadowRoot?.querySelector(
        '.runtime-toast',
      ) as HTMLElement | null
      toastEl?.click()
    })
    await page.waitForSelector('vite-error-overlay')

    const borderColor = await getOverlayBorderColor()
    // yellow (#e2aa53) should appear as rgb(226, 170, 83)
    expect(borderColor).toBe('rgb(226, 170, 83)')
  },
)

test.runIf(isServe)(
  'runtime overlay: closing overlay removes it from DOM',
  async () => {
    await page.goto(viteTestUrl)
    await page.click('#test-runtime-overlay')
    await page.waitForSelector('vite-runtime-errors-toast')
    await page.evaluate(() => {
      const toast = document.querySelector('vite-runtime-errors-toast')
      const toastEl = toast?.shadowRoot?.querySelector(
        '.runtime-toast',
      ) as HTMLElement | null
      toastEl?.click()
    })
    await page.waitForSelector('vite-error-overlay')
    await page.evaluate(() => {
      const overlay = document.querySelector(
        'vite-error-overlay',
      ) as HTMLElement | null
      overlay?.click()
    })
    await expect.poll(() => page.locator('vite-error-overlay').count()).toBe(0)
  },
)
