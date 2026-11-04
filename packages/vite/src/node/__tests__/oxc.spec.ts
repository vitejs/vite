import { describe, expect, test } from 'vitest'
import { createLogger } from '../logger'
import { convertEsbuildConfigToOxcConfig } from '../plugins/oxc'

describe('convertEsbuildConfigToOxcConfig', () => {
  const logger = createLogger('silent')

  // esbuild's `jsxSideEffects` is the inverse of oxc's `jsx.pure`:
  // `jsxSideEffects: true` means JSX has side effects, i.e. it is NOT pure.
  test('inverts jsxSideEffects when mapping to jsx.pure', () => {
    expect(
      convertEsbuildConfigToOxcConfig({ jsxSideEffects: true }, logger).jsx,
    ).toMatchObject({ pure: false })
    expect(
      convertEsbuildConfigToOxcConfig({ jsxSideEffects: false }, logger).jsx,
    ).toMatchObject({ pure: true })
  })
})
