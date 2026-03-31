import { describe, expect, test } from 'vitest'
import { EvaluatedModules } from '../evaluatedModules'

describe('EvaluatedModules', () => {
  test('ensureModule creates a new module and indexes by id and url', () => {
    const modules = new EvaluatedModules()
    const mod = modules.ensureModule('/path/to/module.js', '/url/module.js')

    expect(mod.id).toBe('/path/to/module.js')
    expect(mod.url).toBe('/url/module.js')
    expect(modules.getModuleById('/path/to/module.js')).toBe(mod)
    expect(modules.getModuleByUrl('/url/module.js')).toBe(mod)
  })

  test('ensureModule returns existing module when id matches', () => {
    const modules = new EvaluatedModules()
    const mod1 = modules.ensureModule('/path/to/module.js', '/url/v1')
    const mod2 = modules.ensureModule('/path/to/module.js', '/url/v2')

    expect(mod1).toBe(mod2)
    // New url should also map to the same module
    expect(modules.getModuleByUrl('/url/v2')).toBe(mod1)
  })

  test('different ids with same url creates separate modules but url maps to latest', () => {
    const modules = new EvaluatedModules()
    const mod1 = modules.ensureModule('/path/v1/index.js', 'shared-dep')
    const mod2 = modules.ensureModule('/path/v2/index.js', 'shared-dep')

    // They should be different module nodes
    expect(mod1).not.toBe(mod2)
    expect(mod1.id).toBe('/path/v1/index.js')
    expect(mod2.id).toBe('/path/v2/index.js')

    // The url 'shared-dep' should map to whichever was registered last
    // This is the bug scenario: bare specifier URL maps to wrong module
    expect(modules.getModuleByUrl('shared-dep')).toBe(mod2)

    // But id-based lookups remain correct
    expect(modules.getModuleById('/path/v1/index.js')).toBe(mod1)
    expect(modules.getModuleById('/path/v2/index.js')).toBe(mod2)
  })
})
