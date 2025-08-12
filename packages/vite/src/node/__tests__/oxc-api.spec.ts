import { describe, expect, it } from 'vitest'

describe('oxc API exports', () => {
  it('should export transformWithOxc function', async () => {
    const vite = await import('../index')
    expect(typeof vite.transformWithOxc).toBe('function')
  })

  it('should accept oxc config in defineConfig', async () => {
    const { defineConfig } = await import('../config')
    
    const config = defineConfig({
      oxc: {
        typescript: true,
        jsx: {
          runtime: 'automatic'
        },
        target: 'es2020'
      }
    })
    
    expect(config.oxc).toBeDefined()
    expect(config.oxc.typescript).toBe(true)
  })
})