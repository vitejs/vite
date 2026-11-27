import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { isFileReadable, normalizePath } from '../../utils'
import { createServer } from '../index'
import { checkLoadingAccess } from '../middlewares/static'

describe("server.fs.strict: 'extended'", () => {
  const cleanups: Array<() => Promise<void> | void> = []

  afterEach(async () => {
    while (cleanups.length > 0) {
      await cleanups.pop()?.()
    }
  })

  test('falls back to SPA HTML for extensionless routes matching a root directory', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-strict-ext-'))
    cleanups.push(() => fs.rmSync(tmpDir, { recursive: true, force: true }))

    const rootDir = path.join(tmpDir, 'app')
    const outsideDir = path.join(tmpDir, 'outside-dir')
    const outsideFile = path.join(outsideDir, 'secret.txt')
    fs.mkdirSync(rootDir, { recursive: true })
    fs.mkdirSync(outsideDir, { recursive: true })
    fs.writeFileSync(
      path.join(rootDir, 'index.html'),
      '<!doctype html><html><body>SPA OK</body></html>',
    )
    fs.writeFileSync(outsideFile, 'top-secret')

    const fsRoot = path.parse(rootDir).root
    const topLevelDir = fs
      .readdirSync(fsRoot, { withFileTypes: true })
      .find((entry) => {
        if (!entry.isDirectory() || !/^[\w-]+$/.test(entry.name)) {
          return false
        }
        const candidate = path.join(fsRoot, entry.name)
        return (
          candidate !== path.dirname(rootDir) &&
          !fs.existsSync(path.join(rootDir, entry.name)) &&
          isFileReadable(candidate)
        )
      })
    expect(topLevelDir).toBeDefined()

    const server = await createServer({
      configFile: false,
      root: rootDir,
      appType: 'spa',
      logLevel: 'silent',
      server: {
        host: '127.0.0.1',
        port: 0,
        ws: false,
        fs: {
          strict: 'extended',
        },
      },
    })
    cleanups.push(() => server.close())

    expect(checkLoadingAccess(server.environments.client, outsideDir)).toBe(
      'fallback',
    )
    expect(checkLoadingAccess(server.environments.client, outsideFile)).toBe(
      'denied',
    )

    await server.listen()
    const baseUrl = server.resolvedUrls!.local[0].replace(/\/$/, '')

    const spaRes = await fetch(`${baseUrl}/${topLevelDir!.name}`, {
      headers: { Accept: 'text/html' },
    })
    expect(spaRes.status).toBe(200)
    expect(await spaRes.text()).toContain('SPA OK')

    const deniedRes = await fetch(
      `${baseUrl}${path.posix.join('/@fs/', normalizePath(outsideFile))}?import&raw`,
    )
    expect(deniedRes.status).toBe(403)
  })
})
