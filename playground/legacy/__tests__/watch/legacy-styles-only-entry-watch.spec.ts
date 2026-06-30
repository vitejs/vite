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
    '#ff69b4',
  )
  expect(findAssetFile(/style-only-entry-legacy-.+\.js/, 'watch')).toContain(
    '#ff69b4',
  )
  expect(findAssetFile(/polyfills-legacy-.+\.js/, 'watch')).toBeTruthy()
  const numberOfManifestEntries = Object.keys(readManifest('watch')).length
  expect(numberOfManifestEntries).toBe(3)

  editFile('style-only-entry.css', (originalContents) =>
    originalContents.replace('#ff69b4', '#ffb6c1'),
  )
  await notifyRebuildComplete(watcher)

  // A single file change can trigger more than one rebuild cycle, and during a
  // rebuild the output directory is transiently emptied and rewritten (the
  // legacy plugin emits its bundle separately, and `emptyOutDir` removes the
  // manifest in between). Reading the manifest/assets immediately after a single
  // `END` event can therefore land in a window where they are momentarily
  // missing, which made this test flaky on CI (see rolldown/rolldown#2830,
  // rolldown/rolldown#2831). Poll until the output settles into the expected
  // final state instead of reading once.
  let updatedManifest: ReturnType<typeof readManifest>
  await expect
    .poll(() => {
      try {
        updatedManifest = readManifest('watch')
      } catch {
        // manifest is transiently missing while a rebuild rewrites the outDir
        return 'manifest not readable'
      }
      if (Object.keys(updatedManifest).length !== numberOfManifestEntries) {
        return 'unexpected number of manifest entries'
      }
      return 'ok'
    })
    .toBe('ok')

  // We must use the file referenced in the manifest here,
  // since there'll be different versions of the file with different hashes.
  const reRenderedCssFile = findAssetFile(
    updatedManifest['style-only-entry.css']!.file.substring('assets/'.length),
    'watch',
  )
  expect(reRenderedCssFile).toContain('#ffb6c1')
  const reRenderedCssLegacyFile = findAssetFile(
    updatedManifest['style-only-entry-legacy.css']!.file.substring(
      'assets/'.length,
    ),
    'watch',
  )
  expect(reRenderedCssLegacyFile).toContain('#ffb6c1')
  expect(findAssetFile(/polyfills-legacy-.+\.js/, 'watch')).toBeTruthy()
})
