import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { isBuild, testDir } from '~utils'

describe.runIf(isBuild)('build', () => {
  // assert correct files
  test('sourcemap generation for web workers', async () => {
    const assetsDir = path.resolve(testDir, 'dist/iife-sourcemap-hidden/assets')

    const files = fs.readdirSync(assetsDir)
    // should have 2 worker chunk
    expect(files.length).toBe(46)
    const index = files.find((f) => f.includes('main-module'))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')
    const indexSourcemap = getSourceMapUrl(content)
    const worker = files.find((f) => /^my-worker-[-\w]+\.js$/.test(f))
    const workerContent = fs.readFileSync(
      path.resolve(assetsDir, worker),
      'utf-8',
    )
    const workerSourcemap = getSourceMapUrl(workerContent)
    const sharedWorker = files.find((f) =>
      /^my-shared-worker-[-\w]+\.js$/.test(f),
    )
    const sharedWorkerContent = fs.readFileSync(
      path.resolve(assetsDir, sharedWorker),
      'utf-8',
    )
    const sharedWorkerSourcemap = getSourceMapUrl(sharedWorkerContent)
    const possibleTsOutputWorker = files.find((f) =>
      /^possible-ts-output-worker-[-\w]+\.js$/.test(f),
    )
    const possibleTsOutputWorkerContent = fs.readFileSync(
      path.resolve(assetsDir, possibleTsOutputWorker),
      'utf-8',
    )
    const possibleTsOutputWorkerSourcemap = getSourceMapUrl(
      possibleTsOutputWorkerContent,
    )
    const workerNestedWorker = files.find((f) =>
      /^worker-nested-worker-[-\w]+\.js$/.test(f),
    )
    const workerNestedWorkerContent = fs.readFileSync(
      path.resolve(assetsDir, workerNestedWorker),
      'utf-8',
    )
    const workerNestedWorkerSourcemap = getSourceMapUrl(
      workerNestedWorkerContent,
    )
    const subWorker = files.find((f) => /^sub-worker-[-\w]+\.js$/.test(f))
    const subWorkerContent = fs.readFileSync(
      path.resolve(assetsDir, subWorker),
      'utf-8',
    )
    const subWorkerSourcemap = getSourceMapUrl(subWorkerContent)

    expect(files).toContainEqual(
      expect.stringMatching(/^index-[-\w]+\.js\.map$/),
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^my-worker-[-\w]+\.js\.map$/),
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^my-shared-worker-[-\w]+\.js\.map$/),
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^possible-ts-output-worker-[-\w]+\.js\.map$/),
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^worker-nested-worker-[-\w]+\.js\.map$/),
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^sub-worker-[-\w]+\.js\.map$/),
    )

    // sourcemap should exist and have a data URL
    expect(indexSourcemap).toBe(null)
    expect(workerSourcemap).toBe(null)
    expect(sharedWorkerSourcemap).toBe(null)
    expect(possibleTsOutputWorkerSourcemap).toBe(null)
    expect(workerNestedWorkerSourcemap).toBe(null)
    expect(subWorkerSourcemap).toBe(null)

    // worker should have all imports resolved and no exports
    expect(workerContent).not.toMatch(`import`)
    expect(workerContent).not.toMatch(`export`)

    // shared worker should have all imports resolved and no exports
    expect(sharedWorkerContent).not.toMatch(`import`)
    expect(sharedWorkerContent).not.toMatch(`export`)

    // chunk
    expect(content).toMatch(
      `new Worker("/iife-sourcemap-hidden/assets/my-worker`,
    )
    expect(content).toMatch(`new Worker("data:text/javascript;charset=utf-8,"+`)
    expect(content).toMatch(
      `new Worker("/iife-sourcemap-hidden/assets/possible-ts-output-worker`,
    )
    expect(content).toMatch(
      `new Worker("/iife-sourcemap-hidden/assets/worker-nested-worker`,
    )
    expect(content).toMatch(
      `new SharedWorker("/iife-sourcemap-hidden/assets/my-shared-worker`,
    )

    // inlined
    expect(content).toMatch(`(self.URL||self.webkitURL).createObjectURL`)
    expect(content).toMatch(`self.Blob`)

    expect(workerNestedWorkerContent).toMatch(
      `new Worker("/iife-sourcemap-hidden/assets/sub-worker`,
    )
  })
})

function getSourceMapUrl(code: string): string {
  const regex = /\/\/[#@]\ssource(?:Mapping)?URL=\s*(\S+)/
  const results = regex.exec(code)

  if (results && results.length >= 2) {
    return results[1]
  }
  return null
}
