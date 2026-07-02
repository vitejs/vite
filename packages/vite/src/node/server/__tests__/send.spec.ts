import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, test } from 'vitest'
import { send } from '../send'

function createReq(url = '/foo.js'): IncomingMessage {
  return { url, method: 'GET', headers: {} } as IncomingMessage
}

function createRes(): ServerResponse & { body?: string | Buffer } {
  const res = {
    writableEnded: false,
    statusCode: 0,
    headers: {} as Record<string, unknown>,
    setHeader(name: string, value: unknown) {
      res.headers[name] = value
      return res
    },
    end(chunk?: string | Buffer) {
      res.body = chunk
      res.writableEnded = true
    },
  }
  return res as unknown as ServerResponse & { body?: string | Buffer }
}

describe('send fallback sourcemap', () => {
  test('injects a fallback sourcemap for js without a map', () => {
    const req = createReq()
    const res = createRes()
    send(req, res, 'const a = 1', 'js', {})
    expect(res.body!.toString()).toContain('//# sourceMappingURL=')
  })

  test('skips the fallback sourcemap for very large js', () => {
    const req = createReq()
    const res = createRes()
    const code = `export default ${JSON.stringify('x\n'.repeat(5_000_000))}`
    send(req, res, code, 'js', {})
    expect(res.body!.toString()).not.toContain('//# sourceMappingURL=')
  })

  test('does not inject a fallback sourcemap for non-js', () => {
    const req = createReq('/foo.css')
    const res = createRes()
    send(req, res, '.a { color: red }', 'css', {})
    expect(res.body!.toString()).not.toContain('sourceMappingURL=')
  })
})
