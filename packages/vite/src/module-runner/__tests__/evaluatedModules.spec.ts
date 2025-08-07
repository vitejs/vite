import { describe, expect, it } from 'vitest'
import { EvaluatedModules } from '../evaluatedModules'

describe('EvaluatedModules sourcemap extraction', () => {
  it('should not crash with InvalidCharacterError when string literals contain sourceMappingURL pattern', () => {
    const modules = new EvaluatedModules()

    // Create a module with source mapping URL in string literal - this is the exact scenario from the issue
    const moduleId = '/test/module.js'
    const moduleUrl = 'http://localhost:3000/test/module.js'
    const node = modules.ensureModule(moduleId, moduleUrl)

    // This is the exact problematic code pattern mentioned in the GitHub issue
    node.meta = {
      code: `throw lazyDOMException('Invalid character', 'InvalidCharacterError');
            ^
DOMException [InvalidCharacterError]: Invalid character
    at atob (node:buffer:1302:13)
    at EvaluatedModules.getModuleSourceMapById (file:///Users/ari/Git/repros/module-runner/node_modules/.pnpm/vite@7.0.6/node_modules/vite/dist/node/module-runner.js:286:59)
    at file:///Users/ari/Git/repros/module-runner/index.mjs:24:31

const text = "//# sourceMappingURL=data:application/json;base64,\${encoded}";`,
    }

    // Before the fix: This would throw InvalidCharacterError: Invalid character
    // After the fix: This should not crash and should return null gracefully
    expect(() => {
      const sourceMap = modules.getModuleSourceMapById(moduleId)
      // The result should be null since there's no valid sourcemap, but it shouldn't crash
      expect(sourceMap).toBeNull()
    }).not.toThrow('Invalid character')
  })

  it('should correctly extract valid sourcemap when present at end of file', () => {
    const modules = new EvaluatedModules()

    const moduleId = '/test/valid-module.js'
    const moduleUrl = 'http://localhost:3000/test/valid-module.js'
    const node = modules.ensureModule(moduleId, moduleUrl)

    // Code with string literal AND a valid sourcemap at the end
    node.meta = {
      code: `function example() {
  const text = "//# sourceMappingURL=data:application/json;base64,invalidbase64";
  return text;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZXMiOlsidGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSJ9`,
    }

    const sourceMap = modules.getModuleSourceMapById(moduleId)
    expect(sourceMap).toBeTruthy()
    expect(sourceMap?.map.version).toBe(3)
    expect(sourceMap?.map.file).toBe('test.js')
  })

  it('should return null if no valid sourcemap is found', () => {
    const modules = new EvaluatedModules()

    const moduleId = '/test/module2.js'
    const moduleUrl = 'http://localhost:3000/test/module2.js'
    const node = modules.ensureModule(moduleId, moduleUrl)

    node.meta = {
      code: `function example() { return "no sourcemap here"; }`,
    }

    const sourceMap = modules.getModuleSourceMapById(moduleId)
    expect(sourceMap).toBeNull()
  })

  it('should handle invalid base64 gracefully without crashing', () => {
    const modules = new EvaluatedModules()

    const moduleId = '/test/module3.js'
    const moduleUrl = 'http://localhost:3000/test/module3.js'
    const node = modules.ensureModule(moduleId, moduleUrl)

    node.meta = {
      code: `function example() { return "test"; }
//# sourceMappingURL=data:application/json;base64,invalidbase64`,
    }

    // This should handle the invalid base64 gracefully and not crash
    expect(() => {
      const sourceMap = modules.getModuleSourceMapById(moduleId)
      expect(sourceMap).toBeNull()
    }).not.toThrow()
  })
})
