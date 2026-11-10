import { beforeAll, describe, expect, it } from 'vitest'
import {
  editFile,
  gotoLatestBuild,
  hotUpdatedLog,
  isBuild,
  page,
  untilBrowserLogAfter,
  viteTestUrl,
} from '~utils'

describe.runIf(!isBuild)('acceptExports with hmrPartialAccept off', () => {
  const CONNECTED = /connected/
  const openPage = (testDir: string) =>
    gotoLatestBuild(`${viteTestUrl}/${testDir}/`)

  describe('importer that uses only accepted exports', () => {
    const testDir = 'accept-exports/main-accepted'
    const file = `${testDir}/target.ts`

    beforeAll(async () => {
      await untilBrowserLogAfter(
        () => openPage(testDir),
        [CONNECTED, />>>>>>/],
        (logs) => {
          expect(logs).toContain('<<<<<< A0 B0 D0 ; dep0')
          expect(logs).toContain('>>>>>> A0 D0')
        },
      )
    })

    it('is not skipped, so the update reaches the root and reloads the page', async () => {
      await untilBrowserLogAfter(
        async () => {
          const loadPromise = page.waitForEvent('load')
          editFile(file, (code) => code.replace(/([ABD])0/g, '$11') + '\n')
          await loadPromise
        },
        [CONNECTED, />>>>>>/],
        (logs) => {
          expect(logs).toContain('<<<<<< A1 B1 D1 ; dep0')
          expect(logs).toContain('>>>>>> A1 D1')
        },
      )
    })
  })

  describe('module that accepts all its exports', () => {
    const testDir = 'accept-exports/star-imports'
    const file = `${testDir}/deps-all-accepted.ts`

    it('still accepts itself', async () => {
      await untilBrowserLogAfter(
        () => openPage(testDir),
        [CONNECTED, '>>> ready <<<'],
        (logs) => {
          expect(logs).toContain('all >>>>>> a0, b0, c0')
        },
      )

      await untilBrowserLogAfter(
        () => {
          editFile(file, (code) => code.replace(/([abc])0/g, '$11') + '\n')
        },
        /hot updated/,
        (logs) => {
          expect(logs).toEqual(['all >>>>>> a1, b1, c1', hotUpdatedLog(file)])
        },
      )
    })
  })
})
