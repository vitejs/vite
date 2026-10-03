import { describe, expect, test, vi } from 'vitest'
import { baseMiddleware } from '../server/middlewares/base'

function run(url: string, base: string) {
  const middleware = baseMiddleware(base, false)
  const req: any = { url, headers: {} }
  const res: any = {
    writeHead: vi.fn().mockReturnThis(),
    end: vi.fn(),
  }
  const next = vi.fn()
  middleware(req, res, next)
  return { req, res, next }
}

describe('baseMiddleware', () => {
  test('strips base from matching requests', () => {
    const { req, next } = run('/foo/bar.js', '/foo')
    expect(next).toHaveBeenCalled()
    expect(req.url).toBe('/bar.js')
  })

  test('serves a request to the base itself as root', () => {
    const { req, next } = run('/foo', '/foo')
    expect(next).toHaveBeenCalled()
    expect(req.url).toBe('/')
  })

  test('does not match paths that only share a partial segment', () => {
    const { res, next } = run('/foobar/a.js', '/foo')
    expect(next).not.toHaveBeenCalled()
    expect(res.writeHead).toHaveBeenCalledWith(404, expect.anything())
  })

  test('does not match requests outside of base', () => {
    const { res, next } = run('/bar.js', '/foo')
    expect(next).not.toHaveBeenCalled()
    expect(res.writeHead).toHaveBeenCalledWith(404, expect.anything())
  })
})
