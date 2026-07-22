import { describe, expect, it, vi } from 'vitest'
import type { BundledDevOptions } from '../../config'
import type { ViteDevServer } from '../index'
import { generateFallbackHtml } from '../middlewares/indexHtml'

vi.mock('../../plugins/clientInjections', () => ({
  getHmrImplementation: () => 'console.log("</script>")',
}))

function createTestServer(bundledDev: true | BundledDevOptions): {
  server: ViteDevServer
  loggerError: ReturnType<typeof vi.fn>
} {
  const loggerError = vi.fn()

  return {
    server: {
      config: {
        logger: {
          error: loggerError,
        },
        experimental: {
          bundledDev,
        },
      },
    } as ViteDevServer,
    loggerError,
  }
}

describe('bundled dev loading HTML', () => {
  it('replaces the default page with a string option', async () => {
    const { server } = createTestServer({
      loadingHtml:
        '<!doctype html><html><head></head><body>Custom</body></html>',
    })

    const html = await generateFallbackHtml(server)

    expect(html).toContain('<body>Custom</body>')
    expect(html).not.toContain('Bundling in progress')
  })

  it('injects the runtime script when custom HTML has no head', async () => {
    const { server } = createTestServer({
      loadingHtml: '<main>Custom</main>',
    })

    const html = await generateFallbackHtml(server)

    expect(html).toContain('<script type="module">')
    expect(html).toContain('console.log("<\\/script>")')
    expect(html.indexOf('<script type="module">')).toBeLessThan(
      html.indexOf('<main>Custom</main>'),
    )
  })

  it('falls back to the default page when the function option throws', async () => {
    const { server, loggerError } = createTestServer({
      loadingHtml: () => {
        throw new Error('broken loading page')
      },
    })

    const html = await generateFallbackHtml(server, '/nested/index.html')

    expect(html).toContain('Bundling in progress')
    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to generate bundled dev loading HTML'),
    )
  })
})
