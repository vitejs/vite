import fs from 'node:fs/promises'
import path from 'node:path'
import type { TestProject } from 'vitest/node'
import type { BrowserServer } from 'playwright-chromium'
import { chromium } from 'playwright-chromium'

let browserServer: BrowserServer | undefined

export async function setup({ provide }: TestProject): Promise<void> {
  browserServer = await chromium.launchServer({
    headless: !process.env.VITE_DEBUG_SERVE,
    args: process.env.CI
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : undefined,
  })

  provide('wsEndpoint', browserServer.wsEndpoint())

  const tempDir = path.resolve(import.meta.dirname, '../playground-temp')
  await fs.rm(tempDir, { recursive: true, force: true })
  await fs.mkdir(tempDir, { recursive: true })
  await fs
    .cp(path.resolve(import.meta.dirname, '../playground'), tempDir, {
      recursive: true,
      dereference: false,
      filter(file) {
        file = file.replace(/\\/g, '/')
        return !file.includes('__tests__') && !/dist(?:\/|$)/.test(file)
      },
    })
    .catch(async (error) => {
      if (error.code === 'EPERM' && error.syscall === 'symlink') {
        throw new Error(
          'Could not create symlinks. On Windows, consider activating Developer Mode to allow non-admin users to create symlinks by following the instructions at https://docs.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development.',
        )
      } else {
        throw error
      }
    })
  // also setup dedicated copy for "variant" tests
  for (const [original, variants] of [
    ['assets', ['encoded-base', 'relative-base', 'runtime-base', 'url-base']],
    ['css', ['lightningcss']],
    ['transform-plugin', ['base']],
  ] as const) {
    for (const variant of variants) {
      await fs.cp(
        path.resolve(tempDir, original),
        path.resolve(tempDir, `${original}__${variant}`),
        { recursive: true },
      )
    }
  }
}

export async function teardown(): Promise<void> {
  await browserServer?.close()
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    await fs.rm(path.resolve(import.meta.dirname, '../playground-temp'), {
      recursive: true,
    })
  }
}
