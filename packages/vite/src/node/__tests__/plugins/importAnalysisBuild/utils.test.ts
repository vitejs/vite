import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseImportsSystemJS } from '../../../plugins/importAnalysisBuild'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')

const readInputFile = (filename: string) =>
  readFileSync(resolve(__dirname, 'system-format-input', filename), {
    encoding: 'utf8',
    flag: 'r'
  })

const snippets = ['hello', 'svelte-legacy-part', 'vue-legacy-part']

describe('parse import system js', () => {
  snippets.forEach((snippet) => {
    it(snippet, () => {
      expect(
        parseImportsSystemJS(readInputFile(`${snippet}.js`))
      ).toMatchSnapshot()
    })
  })
})
