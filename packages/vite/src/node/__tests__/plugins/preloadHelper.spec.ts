import { afterEach, describe, expect, test, vi } from 'vitest'
import { PartialEnvironment } from '../../baseEnvironment'
import { resolveConfig } from '../../config'
import { getPreloadCode } from '../../plugins/importAnalysisBuild'

afterEach(() => {
  vi.unstubAllGlobals()
})

class Link extends EventTarget {
  href = ''
  rel = ''
  as = ''
  crossOrigin = ''
  attributes = new Map<string, string>()

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }
}

async function setup() {
  const links: Link[] = []
  const window = new EventTarget()
  vi.stubGlobal('window', window)
  vi.stubGlobal('document', {
    querySelector: () => ({ nonce: 'nonce-value' }),
    getElementsByTagName: () => links,
    createElement: () => new Link(),
    head: { appendChild: (link: Link) => links.push(link) },
  })
  const config = await resolveConfig(
    { configFile: false, base: 'https://example.com/' },
    'build',
  )
  const code = getPreloadCode(
    new PartialEnvironment('client', config),
    false,
    false,
  )
    .replaceAll('__VITE_IS_MODERN__', 'true')
    // Vitest rewrites import.meta before the helper is stringified.
    .replaceAll('__vite_ssr_import_meta__', 'import.meta')
  const { __vitePreload: preload } = await import(
    /* @vite-ignore */
    `data:text/javascript;base64,${Buffer.from(code).toString('base64')}#${crypto.randomUUID()}`
  )
  return { preload, links, window }
}

describe('generated preload helper', () => {
  test('shares pending CSS loads, applies the nonce and skips settled dependencies', async () => {
    const { preload, links } = await setup()
    const module = Promise.resolve('loaded')
    const importer = vi.fn(() => module)
    const first = preload(importer, ['style.css?version=1', 'chunk.js'])
    const second = preload(importer, ['style.css?version=1', 'chunk.js'])

    await Promise.resolve()
    expect(importer).not.toHaveBeenCalled()
    expect(links).toHaveLength(2)
    const stylesheet = links.find((link) => link.rel === 'stylesheet')!
    expect(stylesheet.href).toBe('https://example.com/style.css?version=1')
    expect(stylesheet.attributes.get('nonce')).toBe('nonce-value')
    expect(links.find((link) => link.rel === 'modulepreload')?.as).toBe(
      'script',
    )

    stylesheet.dispatchEvent(new Event('load'))
    await expect(Promise.all([first, second])).resolves.toEqual([
      'loaded',
      'loaded',
    ])
    await expect(
      preload(importer, ['style.css?version=1', 'chunk.js']),
    ).resolves.toBe('loaded')
    expect(links).toHaveLength(2)
  })

  test('shares a stylesheet failure with every waiter', async () => {
    const { preload, links, window } = await setup()
    const errors: unknown[] = []
    window.addEventListener('vite:preloadError', (event) => {
      errors.push((event as Event & { payload: unknown }).payload)
    })
    const importer = vi.fn(() => Promise.resolve('loaded'))
    const results = Promise.allSettled([
      preload(importer, ['style.css']),
      preload(importer, ['style.css']),
    ])
    links[0].dispatchEvent(new Event('error'))

    const settled = await results
    expect(settled).toHaveLength(2)
    expect(settled.every((result) => result.status === 'rejected')).toBe(true)
    expect(errors).toHaveLength(2)
    expect(errors[0]).toBe(errors[1])
    expect(importer).not.toHaveBeenCalled()
    expect(links).toHaveLength(1)
  })

  test('waits for every CSS load before reporting an uncanceled failure', async () => {
    const { preload, links, window } = await setup()
    const errorEvent = vi.fn()
    window.addEventListener('vite:preloadError', errorEvent)
    const importer = vi.fn(() => Promise.resolve('loaded'))
    const result = preload(importer, ['first.css', 'second.css'])
    const rejection = expect(result).rejects.toThrow('Unable to preload CSS')
    links[0].dispatchEvent(new Event('error'))
    await Promise.resolve()
    expect(errorEvent).not.toHaveBeenCalled()
    expect(importer).not.toHaveBeenCalled()

    links[1].dispatchEvent(new Event('load'))
    await rejection
    expect(errorEvent).toHaveBeenCalledTimes(1)
    expect(importer).not.toHaveBeenCalled()
  })

  test('reports canceled failures in dependency order before importing the module', async () => {
    const { preload, links, window } = await setup()
    const errors: string[] = []
    window.addEventListener('vite:preloadError', (event) => {
      event.preventDefault()
      errors.push((event as Event & { payload: Error }).payload.message)
    })
    const importer = vi.fn(() => {
      expect(errors).toEqual([
        'Unable to preload CSS for https://example.com/first.css',
        'Unable to preload CSS for https://example.com/second.css',
      ])
      return Promise.resolve('loaded')
    })
    const result = preload(importer, ['first.css', 'second.css'])
    links[1].dispatchEvent(new Event('error'))
    links[0].dispatchEvent(new Event('error'))

    await expect(result).resolves.toBe('loaded')
    expect(importer).toHaveBeenCalledTimes(1)
  })

  test('skips links already present in server-rendered markup', async () => {
    const { preload, links } = await setup()
    const stylesheet = new Link()
    stylesheet.href = 'https://example.com/style.css'
    stylesheet.rel = 'stylesheet'
    links.push(stylesheet)
    await expect(
      preload(() => Promise.resolve('loaded'), ['style.css']),
    ).resolves.toBe('loaded')
    expect(links).toEqual([stylesheet])
  })

  test('preserves falsy module rejection payloads', async () => {
    const { preload, window } = await setup()
    const errors: unknown[] = []
    window.addEventListener('vite:preloadError', (event) => {
      errors.push((event as Event & { payload: unknown }).payload)
    })
    await expect(
      preload(() => Promise.reject(undefined), []),
    ).rejects.toBeUndefined()
    expect(errors).toEqual([undefined])
  })
})
