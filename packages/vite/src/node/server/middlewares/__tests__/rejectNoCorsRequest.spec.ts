import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, test, vi } from 'vitest'
import { rejectNoCorsRequestMiddleware } from '../rejectNoCorsRequest'

function createReq(headers: Record<string, string>): IncomingMessage {
  return { headers } as unknown as IncomingMessage
}

function createRes(): ServerResponse & { body: string } {
  const res = {
    statusCode: 200,
    body: '',
    end(msg?: string) {
      res.body = msg ?? ''
    },
  }
  return res as unknown as ServerResponse & { body: string }
}

describe('rejectNoCorsRequestMiddleware', () => {
  const middleware = rejectNoCorsRequestMiddleware()

  test('blocks cross-site no-cors script requests', () => {
    const req = createReq({
      'sec-fetch-mode': 'no-cors',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-dest': 'script',
    })
    const res = createRes()
    const next = vi.fn()

    middleware(req, res, next)

    expect(res.statusCode).toBe(403)
    expect(next).not.toHaveBeenCalled()
  })

  test('allows same-origin requests', () => {
    const req = createReq({
      'sec-fetch-mode': 'no-cors',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-dest': 'script',
    })
    const res = createRes()
    const next = vi.fn()

    middleware(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(next).toHaveBeenCalled()
  })

  test('allows same-site requests (e.g. different port on localhost)', () => {
    const req = createReq({
      'sec-fetch-mode': 'no-cors',
      'sec-fetch-site': 'same-site',
      'sec-fetch-dest': 'script',
    })
    const res = createRes()
    const next = vi.fn()

    middleware(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(next).toHaveBeenCalled()
  })

  test('allows cors mode requests regardless of site', () => {
    const req = createReq({
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-dest': 'script',
    })
    const res = createRes()
    const next = vi.fn()

    middleware(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(next).toHaveBeenCalled()
  })

  test('allows no-cors requests for non-script destinations', () => {
    const req = createReq({
      'sec-fetch-mode': 'no-cors',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-dest': 'image',
    })
    const res = createRes()
    const next = vi.fn()

    middleware(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(next).toHaveBeenCalled()
  })

  test('allows requests without sec-fetch headers', () => {
    const req = createReq({})
    const res = createRes()
    const next = vi.fn()

    middleware(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(next).toHaveBeenCalled()
  })

  test('blocks no-cors script requests with sec-fetch-site: none', () => {
    const req = createReq({
      'sec-fetch-mode': 'no-cors',
      'sec-fetch-site': 'none',
      'sec-fetch-dest': 'script',
    })
    const res = createRes()
    const next = vi.fn()

    middleware(req, res, next)

    expect(res.statusCode).toBe(403)
    expect(next).not.toHaveBeenCalled()
  })
})
