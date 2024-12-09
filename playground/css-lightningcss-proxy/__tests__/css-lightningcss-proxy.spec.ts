import { describe, expect, test } from 'vitest'
import { port } from './serve'
import { getColor, isServe, page } from '~utils'

const url = `http://localhost:${port}`

describe.runIf(isServe)('injected inline style', () => {
  test('injected inline style is present', async () => {
    await page.goto(url)
    const el = await page.$('.ssr-proxy')
    expect(await getColor(el)).toBe('coral')
  })
})
