import { describe, expect, it } from 'vitest'
import { EvaluatedModules } from '../evaluatedModules'

describe('EvaluatedModules sourcemap extraction', () => {
  it('should extract sourcemap from the last occurrence, not the first', () => {
    const modules = new EvaluatedModules()

    // Create a module with source mapping URL in string literal and actual sourcemap comment
    const moduleId = '/test/module.js'
    const moduleUrl = 'http://localhost:3000/test/module.js'
    const node = modules.ensureModule(moduleId, moduleUrl)

    // Mock module metadata with problematic code
    node.meta = {
      code: `
function example() {
  // This string literal contains the pattern that causes issues
  const text = "//# sourceMappingURL=data:application/json;base64,invalidbase64";
  return text;
}

export { example };

// This is the actual source map comment at the end (valid base64 that decodes to valid JSON)
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZXMiOlsidGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSJ9
`.trim(),
    }

    // This should not throw an error and should return the correct sourcemap
    const sourceMap = modules.getModuleSourceMapById(moduleId)

    expect(sourceMap).toBeTruthy()
    // The sourcemap should successfully decode and not crash with "Invalid character"
  })

  it('should return null if no valid sourcemap is found', () => {
    const modules = new EvaluatedModules()

    const moduleId = '/test/module2.js'
    const moduleUrl = 'http://localhost:3000/test/module2.js'
    const node = modules.ensureModule(moduleId, moduleUrl)

    node.meta = {
      code: `
function example() {
  return "no sourcemap here";
}
`.trim(),
    }

    const sourceMap = modules.getModuleSourceMapById(moduleId)
    expect(sourceMap).toBeNull()
  })

  it('should handle invalid base64 gracefully', () => {
    const modules = new EvaluatedModules()

    const moduleId = '/test/module3.js'
    const moduleUrl = 'http://localhost:3000/test/module3.js'
    const node = modules.ensureModule(moduleId, moduleUrl)

    node.meta = {
      code: `
function example() {
  return "test";
}

// Invalid base64 in sourcemap comment
//# sourceMappingURL=data:application/json;base64,invalidbase64
`.trim(),
    }

    // This should handle the invalid base64 gracefully and not crash
    const sourceMap = modules.getModuleSourceMapById(moduleId)
    expect(sourceMap).toBeNull()
  })
})
