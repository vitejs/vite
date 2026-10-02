import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, test } from 'vitest'
import { isFileLoadingAllowed, resolveConfig } from '../..'
import { normalizePath } from '../../utils'

const tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'vite-')))

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

async function resolve(root: string, fsOptions?: { allow?: string[] }) {
  fs.mkdirSync(root, { recursive: true })
  const config = await resolveConfig(
    { root, configFile: false, logLevel: 'silent', server: { fs: fsOptions } },
    'serve',
  )
  return {
    config,
    isAllowed: (file: string) =>
      isFileLoadingAllowed(config, normalizePath(path.join(root, file))),
  }
}

describe('server.fs.deny default patterns', () => {
  test('denies .git and .env inside the root', async () => {
    const { isAllowed } = await resolve(path.join(tmpDir, 'normal'))
    expect(isAllowed('src/main.js')).toBe(true)
    expect(isAllowed('.git/config')).toBe(false)
    expect(isAllowed('packages/a/.git/config')).toBe(false)
    expect(isAllowed('.env')).toBe(false)
    expect(isAllowed('.env.local')).toBe(false)
    expect(isAllowed('server.pem')).toBe(false)
  })

  test('serves files when the root itself is inside a .git directory', async () => {
    const root = path.join(tmpDir, 'repo', '.git', 'worktrees', 'app')
    const { config, isAllowed } = await resolve(root)
    expect(isAllowed('src/main.js')).toBe(true)
    expect(isAllowed('index.html')).toBe(true)
    // the patterns still apply to files inside the root
    expect(isAllowed('.git/config')).toBe(false)
    expect(isAllowed('packages/a/.git/config')).toBe(false)
    expect(isAllowed('.env')).toBe(false)
    expect(isAllowed('server.pem')).toBe(false)
    // files outside of the root are still matched against the absolute path
    const outside = normalizePath(path.join(tmpDir, 'repo', '.git', 'config'))
    expect(isFileLoadingAllowed(config, outside)).toBe(false)
  })

  test('keeps denying .git outside the root in an allowed directory', async () => {
    const workspace = path.join(tmpDir, 'workspace')
    const root = path.join(workspace, 'packages', 'app')
    const { config } = await resolve(root, { allow: [workspace] })
    expect(
      isFileLoadingAllowed(config, normalizePath(`${workspace}/.git/config`)),
    ).toBe(false)
    expect(
      isFileLoadingAllowed(config, normalizePath(`${workspace}/shared/a.js`)),
    ).toBe(true)
  })

  test('absolute user patterns still match', async () => {
    const root = path.join(tmpDir, 'abs')
    fs.mkdirSync(root, { recursive: true })
    const secret = normalizePath(path.join(root, 'secret'))
    const config = await resolveConfig(
      {
        root,
        configFile: false,
        logLevel: 'silent',
        server: { fs: { deny: [`${secret}/**`] } },
      },
      'serve',
    )
    expect(isFileLoadingAllowed(config, `${secret}/a.txt`)).toBe(false)
    expect(
      isFileLoadingAllowed(config, normalizePath(path.join(root, 'ok.txt'))),
    ).toBe(true)
  })
})
