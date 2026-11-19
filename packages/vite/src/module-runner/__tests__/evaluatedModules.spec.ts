import { describe, expect, it } from 'vitest'
import { EvaluatedModules } from '../evaluatedModules'

describe('EvaluatedModules', () => {
  it('looks up wrapped and unwrapped URLs consistently', () => {
    const modules = new EvaluatedModules()
    const node = modules.ensureModule(
      '\0virtual:test',
      '/@id/__x00__virtual:test',
    )
    modules.ensureModule(node.id, '/@id/__x00__virtual:alias')
    modules.setModuleByUrl('/@id/__x00__virtual:other', node)

    for (const id of ['virtual:test', 'virtual:alias', 'virtual:other']) {
      expect(modules.getModuleByUrl(`/@id/__x00__${id}`)).toBe(node)
      expect(modules.getModuleByUrl(`\0${id}`)).toBe(node)
    }

    modules.removeModule(node)

    expect(modules.urlToIdModuleMap.size).toBe(0)
  })

  it('removes every URL mapped to a module', () => {
    const modules = new EvaluatedModules()
    const node = modules.ensureModule('/src/test.js', '/test.js')
    modules.ensureModule(node.id, '/test')
    modules.ensureModule(node.id, 'file:///src/test.js')
    const other = modules.ensureModule('/src/other.js', '/other.js')

    modules.removeModule(node)

    expect(modules.getModuleById(node.id)).toBeUndefined()
    expect(modules.getModulesByFile(node.file)).toBeUndefined()
    expect([...modules.urlToIdModuleMap]).toStrictEqual([['/other.js', other]])
  })

  it('keeps other modules associated with the same file', () => {
    const modules = new EvaluatedModules()
    const node = modules.ensureModule('/src/test.js', '/test.js')
    const raw = modules.ensureModule('/src/test.js?raw', '/test.js?raw')

    modules.removeModule(node)

    expect(modules.getModulesByFile(raw.file)).toStrictEqual(new Set([raw]))
    expect(modules.getModuleById(raw.id)).toBe(raw)
    expect(modules.getModuleByUrl(raw.url)).toBe(raw)

    modules.removeModule(raw)

    expect(modules.getModulesByFile(raw.file)).toBeUndefined()
  })
})
