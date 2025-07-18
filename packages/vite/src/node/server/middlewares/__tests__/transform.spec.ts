import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import type { ViteDevServer } from '../../..'
import { createServer } from '../../..'
import { transformMiddleware } from '../transform'

describe('transform middleware HEAD request support', () => {
  let server: ViteDevServer

  beforeEach(async () => {
    server = await createServer({
      configFile: false,
      root: '/tmp/test-project',
      server: {
        middlewareMode: true,
      },
    })
  })

  afterEach(async () => {
    await server?.close()
  })

  test('allows HEAD requests to be processed (not immediately call next)', async () => {
    const middleware = transformMiddleware(server)

    // Mock request object for HEAD request to a JS file
    const mockReq = {
      method: 'HEAD',
      url: '/src/main.js',
      headers: {
        'if-none-match': undefined,
      },
    }

    // Mock response object
    const mockRes = {
      statusCode: 200,
      writableEnded: false,
      setHeader: () => {},
      end: () => {},
    }

    // Track if next was called immediately (which would indicate the old behavior)
    let nextCalledImmediately = false
    const mockNext = () => {
      nextCalledImmediately = true
    }

    // The middleware should not call next() immediately for HEAD requests to JS files
    await middleware(mockReq as any, mockRes as any, mockNext)

    // With the fix, HEAD requests should be processed (not immediately call next())
    // The middleware should attempt to process the request even though the file doesn't exist
    expect(nextCalledImmediately).toBe(false)
  })

  test('still rejects non-GET/HEAD requests', async () => {
    const middleware = transformMiddleware(server)

    // Mock request object for POST request
    const mockReq = {
      method: 'POST',
      url: '/src/main.js',
      headers: {},
    }

    // Mock response object
    const mockRes = {
      statusCode: 200,
      writableEnded: false,
      setHeader: () => {},
      end: () => {},
    }

    // Track if next was called immediately
    let nextCalledImmediately = false
    const mockNext = () => {
      nextCalledImmediately = true
    }

    await middleware(mockReq as any, mockRes as any, mockNext)

    // POST requests should call next() immediately
    expect(nextCalledImmediately).toBe(true)
  })

  test('still rejects ignored URLs', async () => {
    const middleware = transformMiddleware(server)

    // Mock request object for HEAD request to favicon
    const mockReq = {
      method: 'HEAD',
      url: '/favicon.ico',
      headers: {},
    }

    // Mock response object
    const mockRes = {
      statusCode: 200,
      writableEnded: false,
      setHeader: () => {},
      end: () => {},
    }

    // Track if next was called immediately
    let nextCalledImmediately = false
    const mockNext = () => {
      nextCalledImmediately = true
    }

    await middleware(mockReq as any, mockRes as any, mockNext)

    // Favicon requests should call next() immediately
    expect(nextCalledImmediately).toBe(true)
  })
})
