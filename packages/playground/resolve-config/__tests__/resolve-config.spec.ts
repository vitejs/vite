import fs from 'fs'
import path from 'path'
import { commandSync } from 'execa'
import { isBuild, testDir, workspaceRoot } from '../../testUtils'

const viteBin = path.join(workspaceRoot, 'packages', 'vite', 'bin', 'vite.js')

const fromTestDir = (...p: string[]) => path.resolve(testDir, ...p)

const build = (configName: string) => {
  commandSync(`${viteBin} build`, { cwd: fromTestDir(configName) })
}
const getDistFile = (configName: string) => {
  return fs.readFileSync(fromTestDir(`${configName}/dist/index.es.js`), 'utf8')
}

if (isBuild) {
  it('loads vite.config.js', () => {
    build('js')
    expect(getDistFile('js')).toContain('console.log(true)')
  })
  it('loads vite.config.js with package#type module', () => {
    build('js-module')
    expect(getDistFile('js-module')).toContain('console.log(true)')
  })
  it('loads vite.config.cjs', () => {
    build('cjs')
    expect(getDistFile('cjs')).toContain('console.log(true)')
  })
  it('loads vite.config.cjs with package#type module', () => {
    build('cjs-module')
    expect(getDistFile('cjs-module')).toContain('console.log(true)')
  })
  it('loads vite.config.mjs', () => {
    build('mjs')
    expect(getDistFile('mjs')).toContain('console.log(true)')
  })
  it('loads vite.config.mjs with package#type module', () => {
    build('mjs-module')
    expect(getDistFile('mjs-module')).toContain('console.log(true)')
  })
  it('loads vite.config.ts', () => {
    build('ts')
    expect(getDistFile('ts')).toContain('console.log(true)')
  })
  it('loads vite.config.ts with package#type module', () => {
    build('ts-module')
    expect(getDistFile('ts-module')).toContain('console.log(true)')
  })
} else {
  // this test doesn't support serve mode
  // must contain at least one test
  test('should work', () => void 0)
}
