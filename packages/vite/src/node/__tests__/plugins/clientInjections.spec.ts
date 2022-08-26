import { describe, expect, test } from 'vitest'
import {
  clientInjectionsPlugin,
  normalizedClientEntry,
  normalizedEnvEntry,
  resolveInjections
} from '../../plugins/clientInjections'
import { resolveConfig } from '../../config'

async function createClientInjectionPluginTransform({
  build = true,
  ssr = false,
  id = 'foo.ts'
} = {}) {
  const config = await resolveConfig({}, build ? 'build' : 'serve')
  const instance = clientInjectionsPlugin(config)
  const transform = async (code: string) => {
    const transform =
      instance.transform && 'handler' in instance.transform
        ? instance.transform.handler
        : instance.transform
    const result = await transform?.call({}, code, id, { ssr })
    return result?.code || result
  }
  return {
    transform,
    injections: resolveInjections(config)
  }
}

describe('clientInjectionsPlugin', () => {
  test('replaces process.env.NODE_ENV for non-SSR', async () => {
    const { transform } = await createClientInjectionPluginTransform()
    expect(await transform('let x = process.env.NODE_ENV;')).toBe(
      'let x = "test";'
    )
  })

  test('ignores process.env.NODE_ENV for SSR', async () => {
    const { transform: ssrTransform } =
      await createClientInjectionPluginTransform({
        ssr: true
      })
    expect(await ssrTransform('let x = process.env.NODE_ENV;')).toBe(null)
  })

  test('ignores process.env.NODE_ENV inside string literal for non-SSR', async () => {
    const { transform } = await createClientInjectionPluginTransform()
    expect(await transform(`let x = 'process.env.NODE_ENV';`)).toBe(null)
    expect(await transform('let x = "process.env.NODE_ENV";')).toBe(null)
    expect(await transform('let x = `process.env.NODE_ENV`;')).toBe(null)
  })

  test('ignores process.env.NODE_ENV inside string literal for SSR', async () => {
    const { transform: ssrTransform } =
      await createClientInjectionPluginTransform({
        ssr: true
      })
    expect(await ssrTransform(`let x = 'process.env.NODE_ENV';`)).toBe(null)
    expect(await ssrTransform('let x = "process.env.NODE_ENV";')).toBe(null)
    expect(await ssrTransform('let x = `process.env.NODE_ENV`;')).toBe(null)
  })

  test('replaces code injections for client entry', async () => {
    const { injections, transform } =
      await createClientInjectionPluginTransform({
        id: normalizedClientEntry
      })
    test.each(Object.keys(injections))('replaces %s', async (key) => {
      expect(await transform(key)).toBe(injections[key])
    })
  })

  test('replaces code injections for env entry', async () => {
    const { injections, transform } =
      await createClientInjectionPluginTransform({
        id: normalizedEnvEntry
      })
    test.each(Object.keys(injections))('replaces %s', async (key) => {
      expect(await transform(key)).toBe(injections[key])
    })
  })

  test('ignores code injections for non entry files', async () => {
    const { injections, transform } =
      await createClientInjectionPluginTransform()
    test.each(Object.keys(injections))('replaces %s', async (key) => {
      expect(await transform(key)).toBe(null)
    })
  })
})
