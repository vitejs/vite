import fs from 'fs'
import path from 'path'
import { untilUpdated, isBuild, testDir } from '../../../testUtils'
import { Page } from 'playwright-chromium'

if (isBuild) {
  // assert correct files
  test('sourcemap generation for web workers', async () => {
    const assetsDir = path.resolve(testDir, 'dist/iife-sourcemap/assets')
    const files = fs.readdirSync(assetsDir)
    const index = files.find((f) => /^main-classic\.\w+\.js$/.test(f))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')
    const indexSourcemap = getSourceMapUrl(content)

    const worker = files.find((f) => /^my-worker\.\w+\.js$/.test(f))
    const workerContent = fs.readFileSync(
      path.resolve(assetsDir, worker),
      'utf-8'
    )
    const workerSourcemap = getSourceMapUrl(workerContent)

    const sharedWorker = files.find((f) =>
      /^my-shared-worker\.\w+\.js$/.test(f)
    )
    const sharedWorkerContent = fs.readFileSync(
      path.resolve(assetsDir, sharedWorker),
      'utf-8'
    )
    const sharedWorkerSourcemap = getSourceMapUrl(sharedWorkerContent)

    expect(files).toContainEqual(
      expect.stringMatching(/^main-classic\.\w+\.js\.map$/)
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^my-worker\.\w+\.js\.map$/)
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^my-shared-worker\.\w+\.js\.map$/)
    )

    // sourcemap should exist and have a data URL
    expect(indexSourcemap).toMatch(/^main-classic\.\w+\.js\.map$/)
    expect(workerSourcemap).toMatch(/^my-worker\.\w+\.js\.map$/)
    expect(sharedWorkerSourcemap).toMatch(/^my-shared-worker\.\w+\.js\.map$/)
  })
}

test('true', () => {
  expect(true).toBe(true)
})

function getSourceMapUrl(code: string): string {
  const regex = /\/\/[#@]\s(?:source(?:Mapping)?URL)=\s*(\S+)/g
  const results = regex.exec(code)

  if (results && results.length >= 2) {
    return results[1]
  }
  return null
}
