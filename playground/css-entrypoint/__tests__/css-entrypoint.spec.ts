import { expect, test } from 'vitest'
import {
  editFile,
  findAssetFile,
  isBuild,
  listAssets,
  notifyRebuildComplete,
  readManifest,
  watcher,
} from '~utils'

test.runIf(isBuild)(
  'build the style css entrypoint, legacy js chunks and nothing else',
  async () => {
    expect(findAssetFile(/styles-.+\.css/)).toContain('hotpink')
    expect(findAssetFile(/styles-legacy-.+\.js/)).toContain('hotpink')
    expect(findAssetFile(/polyfills-legacy-.+\.js/)).toBeTruthy()
    expect(listAssets()).toHaveLength(3)
    expect(Object.keys(readManifest())).toHaveLength(3)

    editFile(
      'src/styles.css',
      (originalContents) => originalContents.replace('hotpink', 'lightpink'),
      true,
    )
    await notifyRebuildComplete(watcher)

    expect(listAssets()).toHaveLength(3)
    expect(Object.keys(readManifest())).toHaveLength(3)
    expect(findAssetFile(/styles-.+\.css/)).toContain('lightpink')
    expect(findAssetFile(/styles-legacy-.+\.js/)).toContain('lightpink')
    expect(findAssetFile(/polyfills-legacy-.+\.js/)).toBeTruthy()
  },
)
