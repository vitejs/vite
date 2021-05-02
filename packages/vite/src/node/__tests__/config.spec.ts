import { InlineConfig } from '..'
import { mergeConfig, resolveConfig, UserConfigExport } from '../config'

describe('mergeConfig', () => {
  test('handles configs with different alias schemas', () => {
    const baseConfig: UserConfigExport = {
      resolve: {
        alias: [
          {
            find: 'foo',
            replacement: 'foo-value'
          }
        ]
      }
    }

    const newConfig: UserConfigExport = {
      resolve: {
        alias: {
          bar: 'bar-value',
          baz: 'baz-value'
        }
      }
    }

    const mergedConfig: UserConfigExport = {
      resolve: {
        alias: [
          {
            find: 'foo',
            replacement: 'foo-value'
          },
          {
            find: 'bar',
            replacement: 'bar-value'
          },
          {
            find: 'baz',
            replacement: 'baz-value'
          }
        ]
      }
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  test('handles assetsInclude', () => {
    const baseConfig: UserConfigExport = {
      assetsInclude: 'some-string'
    }

    const newConfig: UserConfigExport = {
      assetsInclude: ['some-other-string', /regexp?/]
    }

    const mergedConfig: UserConfigExport = {
      assetsInclude: ['some-string', 'some-other-string', /regexp?/]
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })

  test('not handles alias not under `resolve`', () => {
    const baseConfig = {
      custom: {
        alias: {
          bar: 'bar-value',
          baz: 'baz-value'
        }
      }
    }

    const newConfig = {
      custom: {
        alias: {
          bar: 'bar-value-2',
          foo: 'foo-value'
        }
      }
    }

    const mergedConfig = {
      custom: {
        alias: {
          bar: 'bar-value-2',
          baz: 'baz-value',
          foo: 'foo-value'
        }
      }
    }

    expect(mergeConfig(baseConfig, newConfig)).toEqual(mergedConfig)
  })
})

describe('resolveConfig', () => {
  test('copies optimizeDeps.exclude to esbuildOptions.external', async () => {
    const config: UserConfigExport = {
      optimizeDeps: {
        exclude: ['foo']
      }
    }

    expect(await resolveConfig(config, 'serve')).toMatchObject({
      optimizeDeps: {
        esbuildOptions: {
          external: ['foo']
        }
      }
    })
  })

  test('uses esbuildOptions.external if set', async () => {
    const config: InlineConfig = {
      optimizeDeps: {
        exclude: ['foo'],
        esbuildOptions: {
          external: ['bar']
        }
      }
    }

    expect(await resolveConfig(config, 'serve')).toMatchObject({
      optimizeDeps: {
        esbuildOptions: {
          external: ['bar']
        }
      }
    })
  })

  test('copies optimizeDeps.keepNames to esbuildOptions.keepNames', async () => {
    const config: InlineConfig = {
      optimizeDeps: {
        keepNames: false
      }
    }

    expect(await resolveConfig(config, 'serve')).toMatchObject({
      optimizeDeps: {
        esbuildOptions: {
          keepNames: false
        }
      }
    })
  })

  test('uses esbuildOptions.keepNames if set', async () => {
    const config: InlineConfig = {
      optimizeDeps: {
        keepNames: true,
        esbuildOptions: {
          keepNames: false
        }
      }
    }

    expect(await resolveConfig(config, 'serve')).toMatchObject({
      optimizeDeps: {
        esbuildOptions: {
          keepNames: false
        }
      }
    })
  })
})
