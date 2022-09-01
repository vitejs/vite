import { describe, expect, test } from 'vitest'
import { getColor, isBuild, page } from '~utils'

describe.runIf(isBuild)('build', () => {
  test('should apply correct style', async () => {
    const greenButton = await page.$('.green')
    const blueButton = await page.$('.blue')
    expect(await getColor(greenButton)).toBe('green')
    expect(await getColor(blueButton)).toBe('blue')
  })
})
