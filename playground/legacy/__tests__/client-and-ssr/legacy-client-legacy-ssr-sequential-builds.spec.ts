import { describe, expect, test } from 'vitest'
import { port } from './serve'
import { isBuild, page } from '~utils'

const url = `http://localhost:${port}`

describe.runIf(isBuild)('client-legacy-ssr-sequential-builds', () => {
  test('should work', async () => {
    await page.goto(url)
    expect(await page.textContent('#app')).toMatch('Hello')
  })

  test('import.meta.env.MODE', async () => {
    // SSR build is always modern
    expect(await page.textContent('#mode')).toMatch('test')
  })
})
