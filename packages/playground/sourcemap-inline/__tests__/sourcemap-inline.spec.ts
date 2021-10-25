import fs from 'fs'
import path from 'path'
import { untilUpdated, isBuild, testDir } from '../../testUtils'
import { Page } from 'playwright-chromium'

if (isBuild) {
  // assert correct files
  test('inlined sourcemap generation for web workers', async () => {
    const assetsDir = path.resolve(testDir, 'dist/assets')
    const files = fs.readdirSync(assetsDir)
    // should have 2 worker chunk
    expect(files.length).toBe(3)
    const index = files.find((f) => f.includes('index'))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')
    const indexSourcemap = getSourceMapUrl(content)
    const worker = files.find((f) => f.includes('my-worker'))
    const workerContent = fs.readFileSync(
      path.resolve(assetsDir, worker),
      'utf-8'
    )
    const workerSourcemap = getSourceMapUrl(workerContent)
    const sharedWorker = files.find((f) => f.includes('my-shared-worker'))
    const sharedWorkerContent = fs.readFileSync(
      path.resolve(assetsDir, sharedWorker),
      'utf-8'
    )
    const sharedWorkerSourcemap = getSourceMapUrl(sharedWorkerContent)

    // sourcemap should exist and have a data URL
    expect(indexSourcemap).toMatch(/^data:/)
    expect(workerSourcemap).toMatch(/^data:/)
    expect(sharedWorkerSourcemap).toMatch(/^data:/)

    // worker should have all imports resolved and no exports
    expect(workerContent).not.toMatch(`import`)
    expect(workerContent).not.toMatch(`export`)

    // shared worker should have all imports resolved and no exports
    expect(sharedWorkerContent).not.toMatch(`import`)
    expect(sharedWorkerContent).not.toMatch(`export`)

    // chunk
    expect(content).toMatch(`new Worker("/assets`)
    expect(content).toMatch(`new SharedWorker("/assets`)
    // inlined
    expect(content).toMatch(`(window.URL||window.webkitURL).createObjectURL`)
    expect(content).toMatch(`window.Blob`)
  })
} else {
  // Workaround so that testing serve does not emit
  // "Your test suite must contain at least one test"
  test('true', () => {
    expect(true).toBe(true)
  })
}

function getSourceMapUrl(code: string): string {
  const regex = /\/\/[#@]\s(?:source(?:Mapping)?URL)=\s*(\S+)/g
  const results = regex.exec(code)

  if (results && results.length >= 2) {
    return results[1]
  }
  return null
}
