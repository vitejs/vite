import { promises as fs } from 'fs'
import path from 'path'
import { untilUpdated, isBuild, testDir } from '../../../testUtils'
import { Page } from 'playwright-chromium'

if (isBuild) {
  const assetsDir = path.resolve(testDir, 'dist/iife-sourcemap-hidden/assets')
  // assert correct files
  test('sourcemap generation for web workers', async () => {
    const files = await fs.readdir(assetsDir)
    // should have 2 worker chunk
    expect(files.length).toBe(25)
    const index = files.find((f) => f.includes('main-module'))
    const content = await fs.readFile(path.resolve(assetsDir, index), 'utf-8')
    const indexSourcemap = getSourceMapUrl(content)
    const worker = files.find((f) => /^my-worker\.\w+\.js$/.test(f))
    const workerContent = await fs.readFile(
      path.resolve(assetsDir, worker),
      'utf-8'
    )
    const workerSourcemap = getSourceMapUrl(workerContent)
    const sharedWorker = files.find((f) =>
      /^my-shared-worker\.\w+\.js$/.test(f)
    )
    const sharedWorkerContent = await fs.readFile(
      path.resolve(assetsDir, sharedWorker),
      'utf-8'
    )
    const sharedWorkerSourcemap = getSourceMapUrl(sharedWorkerContent)
    const possibleTsOutputWorker = files.find((f) =>
      /^possible-ts-output-worker\.\w+\.js$/.test(f)
    )
    const possibleTsOutputWorkerContent = await fs.readFile(
      path.resolve(assetsDir, possibleTsOutputWorker),
      'utf-8'
    )
    const possibleTsOutputWorkerSourcemap = getSourceMapUrl(
      possibleTsOutputWorkerContent
    )
    const workerNestedWorker = files.find((f) =>
      /^worker-nested-worker\.\w+\.js$/.test(f)
    )
    const workerNestedWorkerContent = await fs.readFile(
      path.resolve(assetsDir, workerNestedWorker),
      'utf-8'
    )
    const workerNestedWorkerSourcemap = getSourceMapUrl(
      workerNestedWorkerContent
    )
    const subWorker = files.find((f) => /^sub-worker\.\w+\.js$/.test(f))
    const subWorkerContent = await fs.readFile(
      path.resolve(assetsDir, subWorker),
      'utf-8'
    )
    const subWorkerSourcemap = getSourceMapUrl(subWorkerContent)

    expect(files).toContainEqual(expect.stringMatching(/^index\.\w+\.js\.map$/))
    expect(files).toContainEqual(
      expect.stringMatching(/^my-worker\.\w+\.js\.map$/)
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^my-shared-worker\.\w+\.js\.map$/)
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^possible-ts-output-worker\.\w+\.js\.map$/)
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^worker-nested-worker\.\w+\.js\.map$/)
    )
    expect(files).toContainEqual(
      expect.stringMatching(/^sub-worker\.\w+\.js\.map$/)
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
      `new Worker("/iife-sourcemap-hidden/assets/my-worker`
    )
    expect(content).toMatch(`new Worker("data:application/javascript;base64`)
    expect(content).toMatch(
      `new Worker("/iife-sourcemap-hidden/assets/possible-ts-output-worker`
    )
    expect(content).toMatch(
      `new Worker("/iife-sourcemap-hidden/assets/worker-nested-worker`
    )
    expect(content).toMatch(
      `new SharedWorker("/iife-sourcemap-hidden/assets/my-shared-worker`
    )

    // inlined
    expect(content).toMatch(`(window.URL||window.webkitURL).createObjectURL`)
    expect(content).toMatch(`window.Blob`)

    expect(workerNestedWorkerContent).toMatch(
      `new Worker("/iife-sourcemap-hidden/assets/sub-worker`
    )
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
