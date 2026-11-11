import { stripVTControlCharacters } from 'node:util'
import { describe, expect, test } from 'vitest'
import { buildErrorMessage, prepareError } from '../error'

function pluginError(plugin: string) {
  return Object.assign(new Error('the error'), { plugin, id: '/src/main.js' })
}

describe('buildErrorMessage', () => {
  test('names the plugin', () => {
    expect(
      stripVTControlCharacters(buildErrorMessage(pluginError('vite:css'))),
    ).toContain('  Plugin: vite:css')
  })

  test('leaves out hidden plugin names', () => {
    const message = stripVTControlCharacters(
      buildErrorMessage(pluginError('vite:css'), [], false, [/^vite:/]),
    )
    expect(message).not.toContain('Plugin:')
    expect(message).toContain('  File: /src/main.js')
  })

  test('names plugins that are not hidden', () => {
    expect(
      stripVTControlCharacters(
        buildErrorMessage(pluginError('my-plugin'), [], false, [/^vite:/]),
      ),
    ).toContain('  Plugin: my-plugin')
  })
})

describe('prepareError', () => {
  test('keeps the plugin name for the overlay', () => {
    expect(prepareError(pluginError('vite:css')).plugin).toBe('vite:css')
  })

  test('leaves out hidden plugin names', () => {
    expect(
      prepareError(pluginError('vite:css'), [/^vite:/]).plugin,
    ).toBeUndefined()
    expect(prepareError(pluginError('my-plugin'), ['my-plugin']).plugin).toBe(
      undefined,
    )
    expect(prepareError(pluginError('my-plugin'), [/^vite:/]).plugin).toBe(
      'my-plugin',
    )
  })
})
