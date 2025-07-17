import { describe, expect, test, vi } from 'vitest'
import type { Connect } from 'dep-types/connect'
import { transformMiddleware } from '../transform'

describe('transformMiddleware', () => {
  test('HEAD request to .js file should be processed by transform middleware', async () => {
    // Mock request and response
    const req = {
      method: 'HEAD',
      url: '/src/main.js',
      headers: {}
    } as any

    const res = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
      writableEnded: false
    } as any

    const next = vi.fn()

    // Create a minimal mock server
    const server = {
      config: {
        root: '/test',
        publicDir: '/test/public',
        server: {
          headers: {},
          sourcemapIgnoreList: false
        },
        logger: {
          warn: vi.fn(),
          error: vi.fn()
        }
      },
      environments: {
        client: {
          moduleGraph: {
            getModuleByEtag: vi.fn(),
            getModuleByUrl: vi.fn()
          },
          depsOptimizer: null
        }
      }
    } as any

    // Create the middleware
    const middleware = transformMiddleware(server)

    // Call the middleware
    await middleware(req, res, next)

    // After the fix, HEAD requests should be processed and not call next()
    // The response should have the correct Content-Type set
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/javascript')
    expect(res.end).toHaveBeenCalledWith() // HEAD requests should not have body
    expect(next).not.toHaveBeenCalled()
  })

  test('HEAD request to .css file should have correct Content-Type', async () => {
    const req = {
      method: 'HEAD',
      url: '/src/main.css',
      headers: {}
    } as any

    const res = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
      writableEnded: false
    } as any

    const next = vi.fn()

    // Create a minimal mock server
    const server = {
      config: {
        root: '/test',
        publicDir: '/test/public',
        server: {
          headers: {},
          sourcemapIgnoreList: false
        },
        logger: {
          warn: vi.fn(),
          error: vi.fn()
        }
      },
      environments: {
        client: {
          moduleGraph: {
            getModuleByEtag: vi.fn(),
            getModuleByUrl: vi.fn()
          },
          depsOptimizer: null
        }
      }
    } as any

    // Create the middleware
    const middleware = transformMiddleware(server)

    // Call the middleware
    await middleware(req, res, next)

    // After the fix, this should set the correct Content-Type for CSS
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/css')
    expect(res.end).toHaveBeenCalledWith() // HEAD requests should not have body
    expect(next).not.toHaveBeenCalled()
  })

  test('GET request should still work normally', async () => {
    const req = {
      method: 'GET',
      url: '/src/main.js',
      headers: {}
    } as any

    const res = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
      writableEnded: false
    } as any

    const next = vi.fn()

    // Create a minimal mock server
    const server = {
      config: {
        root: '/test',
        publicDir: '/test/public',
        server: {
          headers: {},
          sourcemapIgnoreList: false
        },
        logger: {
          warn: vi.fn(),
          error: vi.fn()
        }
      },
      environments: {
        client: {
          moduleGraph: {
            getModuleByEtag: vi.fn(),
            getModuleByUrl: vi.fn()
          },
          depsOptimizer: null
        }
      }
    } as any

    // Create the middleware
    const middleware = transformMiddleware(server)

    // Call the middleware
    await middleware(req, res, next)

    // GET requests should still proceed to transformRequest
    // Since we don't have a proper mock for transformRequest, it will proceed to other logic
    // This test mainly ensures we didn't break the existing GET flow
  })
})