import fs from 'node:fs/promises'
import path from 'node:path'
import type { GlobalSetupContext } from 'vitest/node'
import type { BrowserServer } from 'playwright-chromium'
import { chromium } from 'playwright-chromium'

let browserServer: BrowserServer | undefined

export async function setup({ provide }: GlobalSetupContext): Promise<void> {
  process.env.NODE_ENV = process.env.VITE_TEST_BUILD
    ? 'production'
    : 'development'

  browserServer = await chromium.launchServer({
    headless: !process.env.VITE_DEBUG_SERVE,
    args: process.env.CI
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : undefined,
  })

  provide('wsEndpoint', browserServer.wsEndpoint())

  const tempDir = path.resolve(__dirname, '../playground-temp')
  await fs.rm(tempDir, { recursive: true, force: true })
  await fs.mkdir(tempDir, { recursive: true })
  await fs
    .cp(path.resolve(__dirname, '../playground'), tempDir, {
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
  await fs.cp(
    path.resolve(tempDir, 'css'),
    path.resolve(tempDir, 'css__sass-modern'),
    { recursive: true },
  )
}

export async function teardown(): Promise<void> {
  await browserServer?.close()
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    await fs.rm(path.resolve(__dirname, '../playground-temp'), {
      recursive: true,
    })
  }
}
