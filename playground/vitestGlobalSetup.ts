import fs from 'node:fs/promises'
import path from 'node:path'
import type { CopyOptions } from 'node:fs'
import type { TestProject } from 'vitest/node'
import type { BrowserServer } from 'playwright-chromium'
import { chromium } from 'playwright-chromium'

let browserServer: BrowserServer | undefined
const PLAYGROUND_NAME_REGEX = /playground\/([\w-]+)\//

export async function setup(project: TestProject): Promise<void> {
  browserServer = await chromium.launchServer({
    headless: !process.env.VITE_DEBUG_SERVE,
    args: process.env.CI
      ? ['--no-sandbox', '--disable-setuid-sandbox']
      : undefined,
  })

  project.provide('wsEndpoint', browserServer.wsEndpoint())

  const tempDir = path.resolve(import.meta.dirname, '../playground-temp')
  const testFiles = project.vitest.state.getPaths()
  const playgroundDirs = [
    ...new Set(testFiles.map((file) => file.match(PLAYGROUND_NAME_REGEX)?.[1])),
  ]
  // These files / directories are used by multiple playground tests
  const commonPlaygroundDirs = ['tsconfig.json', 'resolve-linked']

  await fs.rm(tempDir, { recursive: true, force: true })
  await fs.mkdir(tempDir, { recursive: true })
  await Promise.all(
    [...commonPlaygroundDirs, ...playgroundDirs].map(async (dir) => {
      const srcDir = path.resolve(import.meta.dirname, dir)
      const destDir = path.resolve(tempDir, dir)
      await copyWithFriendlyError(srcDir, destDir, {
        recursive: true,
        filter: filterForPlaygroundCopy,
      })
    }),
  )
  // also setup dedicated copy for "variant" tests
  const dedicatedCopyList: Record<string, string[]> = {
    assets: ['encoded-base', 'relative-base', 'runtime-base', 'url-base'],
    css: ['lightningcss'],
    'transform-plugin': ['base'],
  }
  const cpPromises = []
  for (const testFile of testFiles) {
    const testName = testFile.match(PLAYGROUND_NAME_REGEX)?.[1]
    const variantName = path.basename(path.dirname(testFile))
    if (variantName === '__tests__') continue
    if (testName && dedicatedCopyList[testName]?.includes(variantName)) {
      const srcDir = path.resolve(import.meta.dirname, testName)
      const destDir = path.resolve(tempDir, `${testName}__${variantName}`)
      cpPromises.push(
        copyWithFriendlyError(srcDir, destDir, {
          recursive: true,
          filter: filterForPlaygroundCopy,
        }),
      )
    }
  }
  await Promise.all(cpPromises)
}

export async function teardown(): Promise<void> {
  await browserServer?.close()
  if (!process.env.VITE_PRESERVE_BUILD_ARTIFACTS) {
    await fs.rm(path.resolve(import.meta.dirname, '../playground-temp'), {
      recursive: true,
    })
  }
}

function copyWithFriendlyError(
  src: string,
  dest: string,
  opts?: CopyOptions,
): Promise<void> {
  return fs.cp(src, dest, opts).catch(async (error) => {
    if (error.code === 'EPERM' && error.syscall === 'symlink') {
      throw new Error(
        'Could not create symlinks. On Windows, consider activating Developer Mode to allow non-admin users to create symlinks by following the instructions at https://docs.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development.',
      )
    } else {
      throw error
    }
  })
}

function filterForPlaygroundCopy(file: string): boolean {
  file = file.replace(/\\/g, '/')
  return !file.includes('__tests__') && !/dist(?:\/|$)/.test(file)
}
