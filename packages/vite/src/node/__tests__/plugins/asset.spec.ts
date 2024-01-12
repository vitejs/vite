import { describe, expect, test } from 'vitest'
import { getShouldInline } from '../../plugins/asset'
import type { ResolvedConfig } from '../../config'

describe('assetPlugin', () => {
  const config = {
    build: {
      assetsInlineLimit: 4096,
    },
  } as ResolvedConfig

  const buffer = Buffer.from('foo')

  test('basic svg', () => {
    expect(getShouldInline('bar.svg', config, 'bar.svg', buffer)).toBe(true)
  })

  test('svg with file option', () => {
    expect(getShouldInline('bar.svg?file', config, 'bar.svg', buffer)).toBe(
      false,
    )
  })

  test('svg with fragment', () => {
    expect(getShouldInline('bar.svg#icon', config, 'bar.svg', buffer)).toBe(
      false,
    )
  })
})
