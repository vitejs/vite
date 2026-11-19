import { describe, expect, test } from 'vitest'
import { SOURCEMAPPING_URL } from '../../shared/constants'
import { EvaluatedModules } from '../evaluatedModules'

describe('EvaluatedModules', () => {
  test.each([
    ['LF', '\n'],
    ['CR', '\r'],
    ['CRLF', '\r\n'],
    ['LINE_SEPARATOR', '\u2028'],
    ['PARAGRAPH_SEPARATOR', '\u2029'],
  ])('extracts inline source maps with %s line endings', (_, separator) => {
    const sourceMap = {
      version: 3,
      sources: ['a.js'],
      names: [],
      mappings: 'AAAA',
    }

    let base64 = ''

    for (let i = 0; i < 20; i++) {
      sourceMap.mappings = 'AAAA' + 'A'.repeat(i)
      base64 = Buffer.from(JSON.stringify(sourceMap)).toString('base64')
      if (!base64.endsWith('=')) break
    }

    const id = '/src/a.js'
    const code = [
      'const value = 1;',
      `//# ${SOURCEMAPPING_URL}=data:application/json;base64,${base64}`,
      'const afterMap = 2;',
    ].join(separator)

    const modules = new EvaluatedModules()
    const node = modules.ensureModule(id, id)

    node.meta = {
      code,
      file: id,
      id,
      url: id,
      invalidate: false,
    }

    const map = modules.getModuleSourceMapById(id)

    expect(map).not.toBeNull()
    expect(map?.map.mappings).toBe(sourceMap.mappings)
  })
})
