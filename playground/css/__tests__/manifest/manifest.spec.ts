import { describe, expect, test } from 'vitest'
import { findAssetFile, isBuild } from '~utils'

const baseDir = 'manifest'
const assets = './'

describe.runIf(isBuild)('manifest', () => {
  test('manifest when cssCodeSplit is false', () => {
    const manifest = JSON.parse(
      findAssetFile(/manifest.json$/, baseDir, assets),
    )
    expect(manifest['async.css'].file).toMatch(manifest['style.css'].file)
    expect(manifest['async/base.css'].file).toMatch(manifest['style.css'].file)
  })
})
