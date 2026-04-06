import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, test } from 'vitest'
import { send } from '../send'

interface MockResponse {
  body?: string | Buffer
  headers: Map<string, string | number | readonly string[]>
  writableEnded: boolean
  statusCode: number
  setHeader(name: string, value: string | number | readonly string[]): void
  end(content?: string | Buffer): void
}

function createMockResponse(): MockResponse {
  const headers = new Map<string, string | number | readonly string[]>()

  return {
    headers,
    writableEnded: false,
    statusCode: 0,
    setHeader(name: string, value: string | number | readonly string[]) {
      headers.set(name.toLowerCase(), value)
    },
    end(content?: string | Buffer) {
      this.writableEnded = true
      this.body = content
    },
  }
}

describe('send', () => {
  test('injects fallback sourcemap for small js responses', () => {
    const req = {
      headers: {},
      method: 'GET',
      url: '/test.js',
    } as IncomingMessage
    const res = createMockResponse()

    send(
      req,
      res as unknown as ServerResponse,
      'export const answer = 42',
      'js',
      {},
    )

    expect(res.body?.toString()).toContain('//# sourceMappingURL=')
  })

  test('skips fallback sourcemap when explicitly disabled', () => {
    const req = {
      headers: {},
      method: 'GET',
      url: '/test.txt?import&raw',
    } as IncomingMessage
    const res = createMockResponse()
    const code = `export default ${JSON.stringify('x\n'.repeat(600_000))}`

    send(req, res as unknown as ServerResponse, code, 'js', {
      skipFallbackSourcemap: true,
    })

    expect(res.body?.toString()).toBe(code)
  })
})
