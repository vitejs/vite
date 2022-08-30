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

const inputs = {
  hello: readInputFile('hello.js'),
  complicated: readInputFile('complicated.js')
}

const run = (name: string) => parseImportsSystemJS(inputs[name])

describe('parse import system js', () => {
  it('hello', () => {
    expect(run('hello')).toMatchSnapshot()
  })

  it('complicated', () => {
    expect(run('complicated')).toMatchSnapshot()
  })
})
