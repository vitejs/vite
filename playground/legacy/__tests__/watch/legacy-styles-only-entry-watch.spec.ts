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
    originalContents.replace('#ff69b4', '#ffb6c1 '),
  )
  await notifyRebuildComplete(watcher)
  // END can fire before both outputs finish: https://github.com/rolldown/rolldown/issues/10613
  await expect
    .poll(() => {
      const updatedManifest = readManifest('watch')
      // Read the files referenced by the manifest because hashes change on rebuild.
      return {
        manifestEntries: Object.keys(updatedManifest).length,
        css: findAssetFile(
          updatedManifest['style-only-entry.css']!.file.substring(
            'assets/'.length,
          ),
          'watch',
        ),
        legacy: findAssetFile(
          updatedManifest['style-only-entry-legacy.css']!.file.substring(
            'assets/'.length,
          ),
          'watch',
        ),
        polyfills: !!findAssetFile(/polyfills-legacy-.+\.js/, 'watch'),
      }
    })
    .toEqual({
      manifestEntries: numberOfManifestEntries,
      css: expect.stringContaining('#ffb6c1'),
      legacy: expect.stringContaining('#ffb6c1'),
      polyfills: true,
    })
})
