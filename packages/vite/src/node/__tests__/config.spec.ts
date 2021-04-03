import { mergeConfig, UserConfigExport } from '../config'

test('merge configs with different alias schemas', () => {
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
