import fs from 'node:fs'
import path from 'node:path'
import { execaCommandSync } from 'execa'
import { describe, expect, it } from 'vitest'
import { isBuild, testDir, viteBinPath } from '~utils'

const fromTestDir = (...p: string[]) => path.resolve(testDir, ...p)

const build = (configName: string) => {
  execaCommandSync(`${viteBinPath} build`, { cwd: fromTestDir(configName) })
}

const getDistFile = (configName: string, extension: string) => {
  return fs.readFileSync(
    fromTestDir(`${configName}/dist/index.${extension}`),
    'utf8',
  )
}

describe.runIf(isBuild)('build', () => {
  it('loads vite.config.js', () => {
    build('js')
    expect(getDistFile('js', 'mjs')).toContain('console.log(true)')
  })
  it('loads vite.config.js with package#type module', () => {
    build('js-module')
    expect(getDistFile('js-module', 'js')).toContain('console.log(true)')
  })
  it('loads vite.config.cjs', () => {
    build('cjs')
    expect(getDistFile('cjs', 'mjs')).toContain('console.log(true)')
  })
  it('loads vite.config.cjs with package#type module', () => {
    build('cjs-module')
    expect(getDistFile('cjs-module', 'js')).toContain('console.log(true)')
  })
  it('loads vite.config.mjs', () => {
    build('mjs')
    expect(getDistFile('mjs', 'mjs')).toContain('console.log(true)')
  })
  it('loads vite.config.mjs with package#type module', () => {
    build('mjs-module')
    expect(getDistFile('mjs-module', 'js')).toContain('console.log(true)')
  })
  it('loads vite.config.ts', () => {
    build('ts')
    expect(getDistFile('ts', 'mjs')).toContain('console.log(true)')
  })
  it('loads vite.config.ts with package#type module', () => {
    build('ts-module')
    expect(getDistFile('ts-module', 'js')).toContain('console.log(true)')
  })
  it('loads vite.config.mts', () => {
    build('mts')
    expect(getDistFile('mts', 'mjs')).toContain('console.log(true)')
  })
  it('loads vite.config.mts with package#type module', () => {
    build('mts-module')
    expect(getDistFile('mts-module', 'js')).toContain('console.log(true)')
  })
  it('loads vite.config.cts', () => {
    build('cts')
    expect(getDistFile('cts', 'mjs')).toContain('console.log(true)')
  })
  it('loads vite.config.cts with package#type module', () => {
    build('cts-module')
    expect(getDistFile('cts-module', 'js')).toContain('console.log(true)')
  })
})
