import { describe, expect, test } from 'vitest'
import { resolveConfig } from '..'

describe('resolveBuildOptions in dev', () => {
  test('build.rollupOptions should not have input in lib', async () => {
    const config = await resolveConfig(
      {
        build: {
          lib: {
            entry: './index.js',
          },
        },
      },
      'serve',
      'dev',
    )

    expect(config.build.rollupOptions).not.toHaveProperty('input')
  })
})
