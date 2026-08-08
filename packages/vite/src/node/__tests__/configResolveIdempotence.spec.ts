import { expect, test } from 'vitest'
import type { InlineConfig } from '..'
import { resolveConfig } from '../config'

test('does not duplicate optimizer plugins when resolving the same inline config twice', async () => {
  const optimizerPlugin = {
    name: 'test:resolve-config-idempotence',
  }

  const inlineConfig: InlineConfig = {
    configFile: false,
    logLevel: 'silent',
    optimizeDeps: {
      rolldownOptions: {
        plugins: [optimizerPlugin],
      },
    },
  }

  const first = await resolveConfig(inlineConfig, 'serve')
  const second = await resolveConfig(inlineConfig, 'serve')

  expect(first.environments.client.optimizeDepsPluginNames).toEqual([
    optimizerPlugin.name,
  ])
  expect(second.environments.client.optimizeDepsPluginNames).toEqual([
    optimizerPlugin.name,
  ])
})
