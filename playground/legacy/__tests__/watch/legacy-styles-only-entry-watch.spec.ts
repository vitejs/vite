import { expect, test } from 'vitest'
import {
  editFile,
  findAssetFile,
  isBuild,
  notifyRebuildComplete,
  readManifest,
  watcher,
} from '~utils'

test.runIf(isBuild)('rebuilds styles only entry on change', async () => {
  expect(findAssetFile(/style-only-entry-.+\.css/, 'watch')).toContain(
    'hotpink',
  )
  expect(findAssetFile(/style-only-entry-legacy-.+\.js/, 'watch')).toContain(
    'hotpink',
  )
  expect(findAssetFile(/polyfills-legacy-.+\.js/, 'watch')).toBeTruthy()
  const numberOfManifestEntries = Object.keys(readManifest('watch')).length
  expect(numberOfManifestEntries).toBe(3)

  editFile(
    'style-only-entry.css',
    (originalContents) => originalContents.replace('hotpink', 'lightpink'),
    true,
  )
  await notifyRebuildComplete(watcher)

  const updatedManifest = readManifest('watch')
  expect(Object.keys(updatedManifest)).toHaveLength(numberOfManifestEntries)

  // We must use the file referenced in the manifest here,
  // since there'll be different versions of the file with different hashes.
  const reRenderedCssFile = findAssetFile(
    updatedManifest['style-only-entry.css']!.file.substring('assets/'.length),
    'watch',
  )
  expect(reRenderedCssFile).toContain('lightpink')
  const reRenderedCssLegacyFile = findAssetFile(
    updatedManifest['style-only-entry-legacy.css']!.file.substring(
      'assets/'.length,
    ),
    'watch',
  )
  expect(reRenderedCssLegacyFile).toContain('lightpink')
  expect(findAssetFile(/polyfills-legacy-.+\.js/, 'watch')).toBeTruthy()
})
