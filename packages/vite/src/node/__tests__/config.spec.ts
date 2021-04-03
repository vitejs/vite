import { mergeConfig, UserConfigExport } from '../config'

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
})
