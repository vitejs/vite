import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { normalizePath } from '../../utils'
import { type ViteDevServer, createServer } from '../index'

describe('transformIndexHtml', () => {
  const root = join(__dirname, 'fixtures/transformIndexHtml')
  let server: ViteDevServer | undefined

  let resolveResult: { path: string; filename: string } | undefined

  beforeEach(async () => {
    server = await createServer({
      root,
      plugins: [
        {
          name: 'transformIndexHtml-record-result',
          transformIndexHtml: {
            order: 'pre',
            handler: (html, ctx) => {
              expect(html).toBe('')
              expect(resolveResult).toBe(undefined)
              resolveResult = { path: ctx.path, filename: ctx.filename }
            },
          },
        },
      ],
    })
  })
  afterEach(async () => {
    if (server) {
      await server.close()
      server = undefined
    }
  })

  async function test(url: string, expPath: string, expFilename: string) {
    resolveResult = undefined
    await server!.transformIndexHtml(url, '')
    expect(resolveResult).toEqual({
      path: expPath,
      filename: normalizePath(expFilename),
    })
  }

  const p = join(root, 'a', 'b')

  it('handles root url', async () => {
    await test('/', '/index.html', join(root, 'index.html'))
  })

  it('handles filename in a subdirectory', async () => {
    await test('/a/b/index.html', '/a/b/index.html', join(p, 'index.html'))
  })
  it('handles no filename in a subdirectory', async () => {
    await test('/a/b/', '/a/b/index.html', join(p, 'index.html'))
  })
  it('handles filename without an extension', async () => {
    await test('/a/b/index', '/a/b/index.html', join(p, 'index.html'))
  })

  it('handles filename other than index.html without extension', async () => {
    await test('/a/b/other', '/a/b/other.html', join(p, 'other.html'))
  })
  it('handles unicode in the path', async () => {
    await test(
      '/%F0%9F%90%B1/',
      '/%F0%9F%90%B1/index.html',
      join(root, '🐱', 'index.html'),
    )
  })

  it('handles search parameters', async () => {
    await test('/a/b/?c=d', '/a/b/index.html', join(p, 'index.html'))
  })

  it('handles hash', async () => {
    await test('/a/b/#c', '/a/b/index.html', join(p, 'index.html'))
  })
})
