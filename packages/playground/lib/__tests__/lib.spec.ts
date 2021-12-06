import { isBuild, testDir, mochaSetup, mochaReset } from '../../testUtils'
import path from 'path'
import fs from 'fs'

describe('lib.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  if (isBuild) {
    it('es', async () => {
      expect(await page.textContent('.es')).toBe('It works')
    })

    it('umd', async () => {
      expect(await page.textContent('.umd')).toBe('It works')
    })

    it('iife', async () => {
      expect(await page.textContent('.iife')).toBe('It works')
    })

    it('Library mode does not include `preload`', async () => {
      expect(await page.textContent('.dynamic-import-message')).toBe(
        'hello vite'
      )
      const code = fs.readFileSync(
        path.join(testDir, 'dist/lib/dynamic-import-message.js'),
        'utf-8'
      )
      expect(code).not.toMatch('__vitePreload')
    })
  } else {
    it('dev', async () => {
      expect(await page.textContent('.demo')).toBe('It works')
    })
  }
})
