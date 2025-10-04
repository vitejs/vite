import { describe, expect, it } from 'vitest'
import { proxyMiddleware } from '../proxy'
import type { ResolvedConfig } from '../../../..'

describe('proxy target validation', () => {
  const mockConfig: ResolvedConfig = {
    // minimal mock
    logger: {
      error: () => {},
      warn: () => {},
      info: () => {},
    },
  } as any

  it('throws for empty string target', () => {
    expect(() => proxyMiddleware(null, { '/api': { target: '' } }, mockConfig)).toThrowError(/Invalid Vite proxy target/)
  })

  it('throws for non-string target', () => {
    expect(() => proxyMiddleware(null, { '/api': { target: null as any } }, mockConfig)).toThrowError(/Invalid Vite proxy target/)
  })

  it('accepts absolute http target', () => {
    expect(() => proxyMiddleware(null, { '/api': { target: 'http://localhost:4000' } }, mockConfig)).not.toThrow()
  })

  it('accepts protocol-relative target', () => {
    expect(() => proxyMiddleware(null, { '/api': { target: '//localhost:4000' } }, mockConfig)).not.toThrow()
  })

  it('throws for invalid URL', () => {
    expect(() =>
      proxyMiddleware(null, { '/api': { target: 'http://' } }, mockConfig),
    ).toThrowError(/cannot parse URL/)
  })
})
