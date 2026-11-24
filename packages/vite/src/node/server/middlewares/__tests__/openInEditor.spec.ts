import type * as http from 'node:http'
import { describe, expect, test } from 'vitest'
import { isCrossSiteRequest } from '../openInEditor'

const HOST = 'localhost:5173'

function req(headers: Record<string, string>): http.IncomingMessage {
  return {
    headers: { host: HOST, ...headers },
  } as unknown as http.IncomingMessage
}

describe('isCrossSiteRequest (the /__open-in-editor guard)', () => {
  test.each([
    ['same-origin request', { 'sec-fetch-site': 'same-origin' }],
    ['direct navigation (Sec-Fetch-Site: none)', { 'sec-fetch-site': 'none' }],
    ['same-site / cross-port request', { 'sec-fetch-site': 'same-site' }],
    ['non-browser request (no fetch metadata, no Origin)', {}],
    ['request whose Origin matches the host', { origin: `http://${HOST}` }],
    ['request from another local port', { origin: 'http://localhost:3000' }],
  ])('treats %s as not cross-site', (_name, headers) => {
    expect(isCrossSiteRequest(req(headers))).toBe(false)
  })

  test.each([
    ['cross-site request', { 'sec-fetch-site': 'cross-site' }],
    ['request with a cross-origin Origin', { origin: 'http://evil.example' }],
    ['request with an opaque Origin (null)', { origin: 'null' }],
  ])('treats %s as cross-site', (_name, headers) => {
    expect(isCrossSiteRequest(req(headers))).toBe(true)
  })
})
