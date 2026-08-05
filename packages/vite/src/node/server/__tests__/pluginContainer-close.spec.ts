import { expect, it } from 'vitest'
import type { UserConfig } from '../../config'
import { resolveConfig } from '../../config'
import { DevEnvironment } from '../environment'

it('passes buildEnd errors to closeBundle', async () => {
  const buildEndError = new Error('buildEnd failed')
  let closeBundleError: Error | undefined
  const environment = await getDevEnvironment({
    plugins: [
      {
        name: 'failing-build-end',
        buildEnd() {
          throw buildEndError
        },
      },
      {
        name: 'close-bundle-cleanup',
        closeBundle(error) {
          closeBundleError = error
        },
      },
    ],
  })

  await expect(environment.pluginContainer.close()).rejects.toBe(buildEndError)
  expect(closeBundleError).toBe(buildEndError)
})

it('passes no error to closeBundle when buildEnd succeeds', async () => {
  let buildEndCalled = false
  let closeBundleCalled = false
  let closeBundleError: Error | undefined
  const environment = await getDevEnvironment({
    plugins: [
      {
        name: 'successful-build-end',
        buildEnd() {
          buildEndCalled = true
        },
      },
      {
        name: 'close-bundle-cleanup',
        closeBundle(error) {
          closeBundleCalled = true
          closeBundleError = error
        },
      },
    ],
  })

  await expect(environment.pluginContainer.close()).resolves.toBeUndefined()
  expect(buildEndCalled).toBe(true)
  expect(closeBundleCalled).toBe(true)
  expect(closeBundleError).toBeUndefined()
})

async function getDevEnvironment(
  inlineConfig?: UserConfig,
): Promise<DevEnvironment> {
  const config = await resolveConfig(
    { configFile: false, ...inlineConfig },
    'serve',
  )

  // @ts-expect-error This plugin requires a ViteDevServer instance.
  config.plugins = config.plugins.filter(
    (plugin) => !plugin.name.includes('pre-alias'),
  )

  const environment = new DevEnvironment('client', config, { hot: true })
  await environment.init()
  return environment
}
