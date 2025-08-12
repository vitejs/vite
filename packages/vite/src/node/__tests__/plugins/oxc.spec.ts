import { describe, expect, it } from 'vitest'
import { transformWithOxc } from '../plugins/oxc'

describe('oxc', () => {
  it('should transform simple JavaScript code', async () => {
    const code = 'const x = 1; console.log(x);'
    const result = await transformWithOxc(code, 'test.js')
    
    expect(result).toBeDefined()
    expect(result.code).toContain('const x = 1')
    expect(result.map).toBeDefined()
  })

  it('should handle TypeScript code', async () => {
    const code = 'const x: number = 1; console.log(x);'
    const result = await transformWithOxc(code, 'test.ts', {
      typescript: true
    })
    
    expect(result).toBeDefined()
    expect(result.code).toBeDefined()
    expect(result.map).toBeDefined()
  })

  it('should handle JSX code', async () => {
    const code = 'import React from "react"; const App = () => <div>Hello</div>;'
    const result = await transformWithOxc(code, 'test.jsx', {
      jsx: {
        runtime: 'automatic'
      }
    })
    
    expect(result).toBeDefined()
    expect(result.code).toBeDefined()
    expect(result.map).toBeDefined()
  })

  it('should respect sourcemap options', async () => {
    const code = 'const x = 1;'
    const resultWithSourceMap = await transformWithOxc(code, 'test.js', {
      sourcemap: true
    })
    
    const resultWithoutSourceMap = await transformWithOxc(code, 'test.js', {
      sourcemap: false
    })
    
    expect(resultWithSourceMap.map).toBeDefined()
    expect(resultWithoutSourceMap.map.mappings).toBe('')
  })
})