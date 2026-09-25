import { beforeEach, describe, expect, test, vi } from 'vitest'

// `../build`, `../plugins/css` and `../server` import `../config` back, so when
// one of them is the entry of the cycle, `../config` is evaluated while the
// entry is still parked on its own imports. Reading the defaults it owns at
// that point yields `undefined`, since the SSR transform swallows the temporal
// dead zone error. Each case resets the module registry so that the module
// under test really is the entry of the cycle.
describe('configDefaults', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('keeps the defaults owned by `../build`', async () => {
    const build = await import('../build')
    const { cyclicConfigDefaults } = await import('../config')

    expect(cyclicConfigDefaults.build).toBe(
      build.buildEnvironmentOptionsDefaults,
    )
    expect(cyclicConfigDefaults.builder).toBe(build.builderOptionsDefaults)
  })

  test('keeps the defaults owned by `../plugins/css`', async () => {
    const css = await import('../plugins/css')
    const { cyclicConfigDefaults } = await import('../config')

    expect(cyclicConfigDefaults.css).toBe(css.cssConfigDefaults)
  })

  test('keeps the defaults owned by `../server`', async () => {
    const server = await import('../server')
    const { cyclicConfigDefaults } = await import('../config')

    expect(cyclicConfigDefaults.server).toBe(server.serverConfigDefaults)
  })
})
