import fs from 'fs'
import path from 'path'
import { commandSync } from 'execa'
import { isBuild, testDir, viteBinPath } from '~utils'

const fromTestDir = (...p: string[]) => path.resolve(testDir, ...p)

const build = (configName: string) => {
  commandSync(`${viteBinPath} build`, { cwd: fromTestDir(configName) })
}

const getDistFile = (configName: string, extension: string) => {
  return fs.readFileSync(
    fromTestDir(`${configName}/dist/index.${extension}`),
    'utf8'
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
})
