import { join } from 'node:path'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

const testDir = join(__dirname, '../__test-temp-empty-css')

describe('empty CSS entry fix', () => {
  test('empty CSS entries should generate CSS files, not JS files', async () => {
    // Setup test directory
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch {}
    mkdirSync(testDir, { recursive: true })

    // Create test files
    writeFileSync(join(testDir, 'empty.css'), '/* comment only */')
    writeFileSync(join(testDir, 'completely-empty.css'), '')
    writeFileSync(join(testDir, 'valid.css'), '.test { color: red; }')

    // Create package.json
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-empty-css',
        type: 'module',
      }),
    )

    // Build with Vite
    const { build } = await import('vite')
    await build({
      configFile: false,
      root: testDir,
      logLevel: 'error',
      build: {
        manifest: true,
        rollupOptions: {
          input: [
            join(testDir, 'empty.css'),
            join(testDir, 'completely-empty.css'),
            join(testDir, 'valid.css'),
          ],
        },
      },
    })

    // Check manifest
    const manifestPath = join(testDir, 'dist/.vite/manifest.json')
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

    // All CSS entries should generate CSS files, not JS files
    for (const [key, entry] of Object.entries(manifest)) {
      if (key.endsWith('.css')) {
        expect(
          (entry as any).file,
          `${key} should generate .css file, not .js`,
        ).toMatch(/\.css$/)
        expect(
          (entry as any).file,
          `${key} should not generate .js file`,
        ).not.toMatch(/\.js$/)
      }
    }

    // Cleanup
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch {}
  })
})
