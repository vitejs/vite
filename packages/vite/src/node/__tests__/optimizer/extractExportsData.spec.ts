import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import type { ViteDevServer } from '../..'
import { createServer } from '../..'
import { extractExportsData } from '../../optimizer'

describe('extractExportsData', () => {
  let server: ViteDevServer | undefined
  let tempDir: string | undefined

  afterEach(async () => {
    await server?.close()
    server = undefined
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      tempDir = undefined
    }
  })

  test('extracts exports from TypeScript enum files', async () => {
    tempDir = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'vite-ts-enum-export-'),
    )
    const filePath = path.join(tempDir, 'status.ts')
    fs.writeFileSync(
      filePath,
      `export enum Status {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}
export const statusMessage = 'ok'
`,
    )

    server = await createServer({
      configFile: false,
      root: tempDir,
      logLevel: 'silent',
    })

    const exportsData = await extractExportsData(
      server.environments.client,
      filePath,
    )

    expect(exportsData.hasModuleSyntax).toBe(true)
    expect(exportsData.exports).toContain('Status')
    expect(exportsData.exports).toContain('statusMessage')
  })

  test('extracts exports from TypeScript file containing only enum', async () => {
    tempDir = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'vite-ts-enum-export-only-'),
    )
    const filePath = path.join(tempDir, 'only-enum.ts')
    fs.writeFileSync(
      filePath,
      `export enum Status {
  GREEN = 'GREEN',
}
`,
    )

    server = await createServer({
      configFile: false,
      root: tempDir,
      logLevel: 'silent',
    })

    const exportsData = await extractExportsData(
      server.environments.client,
      filePath,
    )

    expect(exportsData.hasModuleSyntax).toBe(true)
    expect(exportsData.exports).toEqual(['Status'])
    expect(exportsData.jsxLoader).toBe(false)
  })

  test('extracts exports from TSX file and sets jsxLoader', async () => {
    tempDir = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'vite-tsx-export-'),
    )
    const filePath = path.join(tempDir, 'component.tsx')
    fs.writeFileSync(
      filePath,
      `export enum Mode { Dark, Light }
export const App = () => <div>Hello</div>
`,
    )

    server = await createServer({
      configFile: false,
      root: tempDir,
      logLevel: 'silent',
    })

    const exportsData = await extractExportsData(
      server.environments.client,
      filePath,
    )

    expect(exportsData.hasModuleSyntax).toBe(true)
    expect(exportsData.exports).toContain('Mode')
    expect(exportsData.exports).toContain('App')
    expect(exportsData.jsxLoader).toBe(true)
  })

  test('extracts exports from .mts file', async () => {
    tempDir = fs.mkdtempSync(
      path.join(fs.realpathSync(os.tmpdir()), 'vite-mts-export-'),
    )
    const filePath = path.join(tempDir, 'index.mts')
    fs.writeFileSync(
      filePath,
      `export enum LogLevel { Info, Warn, Error }
export function log() {}
`,
    )

    server = await createServer({
      configFile: false,
      root: tempDir,
      logLevel: 'silent',
    })

    const exportsData = await extractExportsData(
      server.environments.client,
      filePath,
    )

    expect(exportsData.hasModuleSyntax).toBe(true)
    expect(exportsData.exports).toContain('LogLevel')
    expect(exportsData.exports).toContain('log')
    expect(exportsData.jsxLoader).toBe(false)
  })
})
