import fs from 'fs'
import path from 'path'
import { untilUpdated, isBuild, testDir } from '../../../testUtils'
import { Page } from 'playwright-chromium'

if (isBuild) {
  // assert correct files
  test('inlined sourcemap generation for web workers', async () => {
    const assetsDir = path.resolve(testDir, 'dist/iife-sourcemap-inline/assets')
    const files = fs.readdirSync(assetsDir)
    const index = files.find((f) => f.includes('main-classic'))
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
    expect(indexSourcemap).toMatch(/^data:application\/json;/)
    expect(workerSourcemap).toMatch(/^data:application\/json;/)
    expect(sharedWorkerSourcemap).toMatch(/^data:application\/json;/)
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
