import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { isBuild, readManifest } from '~utils'

describe.runIf(isBuild)('empty CSS entries', () => {
  test('empty CSS files should generate .css assets, not .js assets', () => {
    const manifest = readManifest()

    // Test that empty.css generates a CSS file
    expect(manifest['empty.css']).toBeDefined()
    expect(manifest['empty.css'].file).toMatch(/\.css$/)
    expect(manifest['empty.css'].file).not.toMatch(/\.js$/)
    expect(manifest['empty.css'].isEntry).toBe(true)

    // Test that empty2.css generates a CSS file
    expect(manifest['empty2.css']).toBeDefined()
    expect(manifest['empty2.css'].file).toMatch(/\.css$/)
    expect(manifest['empty2.css'].file).not.toMatch(/\.js$/)
    expect(manifest['empty2.css'].isEntry).toBe(true)
  })
})
