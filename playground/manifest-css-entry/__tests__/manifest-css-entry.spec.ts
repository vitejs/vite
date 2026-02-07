import { describe, expect, test } from 'vitest'
import { isBuild, readManifest } from '~utils'

describe.runIf(isBuild)('manifest-css-entry', () => {
  test('import-only css entry should have isEntry: true', () => {
    const manifest = readManifest()
    const mainCssEntry = manifest['frontend/entrypoints/main.css']
    expect(mainCssEntry).toBeDefined()
    expect(mainCssEntry.isEntry).toBe(true)
  })
})
