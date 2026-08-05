import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import type { RolldownOutput } from 'rolldown'
import { build } from '../../build'

const dirname = import.meta.dirname

describe('preload helper with renderBuiltUrl query suffix', () => {
  test('classifies query-suffixed CSS URLs as stylesheets', async () => {
    const result = (await build({
      root: resolve(dirname, '../packages/build-project'),
      logLevel: 'silent',
      build: {
        write: false,
        minify: false,
      },
      plugins: [
        {
          name: 'test',
          resolveId(id) {
            if (id === 'entry.js' || id === 'subentry.js' || id === 'foo.css') {
              return '\0' + id
            }
          },
          load(id) {
            if (id === '\0entry.js') {
              return `window.addEventListener('click', () => { import('subentry.js') })`
            }
            if (id === '\0subentry.js') {
              return `import 'foo.css'`
            }
            if (id === '\0foo.css') {
              return `.foo { color: red }`
            }
          },
        },
      ],
      experimental: {
        renderBuiltUrl(filename, { type }) {
          if (type === 'asset') return filename + '?dpl=deploy123'
        },
      },
    })) as RolldownOutput

    const entry = result.output.find(
      (o) => o.type === 'chunk' && o.fileName.includes('index'),
    )
    expect(entry).toBeDefined()
    expect(entry!.code).toMatch(
      /new URL\s*\([^)]*dep[^)]*\)\.pathname\.endsWith\(['"`.]\.css['"`.]\)/,
    )
    expect(entry!.code).not.toMatch(/dep\.endsWith\(['"`.]\.css['"`.]\)/)
    expect(entry!.code).toContain('?dpl=deploy123')
  })
})
