import { isBuild, testDir } from '../../testUtils'
import fs from 'fs-extra'
import path from 'path'

test('response from worker', async () => {
  const distDir = path.resolve(testDir, 'dist')
  const { run } = require(path.join(distDir, 'main.cjs'))
  expect(await run('ping')).toBe('pong')
})

test('response from inline worker', async () => {
  const distDir = path.resolve(testDir, 'dist')
  const { inlineWorker } = require(path.join(distDir, 'main.cjs'))
  expect(await inlineWorker('ping')).toBe('this is inline node worker')
})

if (isBuild) {
  test('worker code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/assets')
    const distDir = path.resolve(testDir, 'dist')
    const files = fs.readdirSync(assetsDir)
    const mainContent = fs.readFileSync(
      path.resolve(distDir, 'main.cjs.js'),
      'utf-8'
    )

    const workerFile = files.find((f) => f.includes('worker'))
    const workerContent = fs.readFileSync(
      path.resolve(assetsDir, workerFile),
      'utf-8'
    )

    expect(files.length).toBe(1)

    // main file worker chunk content
    expect(mainContent).toMatch(`require("worker_threads")`)
    expect(mainContent).toMatch(`Worker`)

    // main content should contain __dirname to resolve module as relation path from main module
    expect(mainContent).toMatch(`__dirname`)

    // should resolve worker_treads from external dependency
    expect(workerContent).toMatch(`require("worker_threads")`)

    // inline nodejs worker
    expect(mainContent).toMatch(`{eval:!0}`)
  })
}
