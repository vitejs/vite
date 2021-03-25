import fs from 'fs'
import path from 'path'
import { untilUpdated, isBuild, testDir } from '../../testUtils'

test('normal', async () => {
  await page.click('.ping')
  await untilUpdated(() => page.textContent('.pong'), 'pong')
  await untilUpdated(
    () => page.textContent('.mode'),
    isBuild ? 'production' : 'development'
  )
})

test('legacy', async () => {
  await page.click('.ping-inline')
  await untilUpdated(() => page.textContent('.pong-inline'), 'pong')
})

if (isBuild) {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/assets')
    const files = fs.readdirSync(assetsDir)
    // should have 1 worker chunk for module and legacy
    expect(files.length).toBe(6)
    expect(files[5]).toMatch('workerImport.')

    const index = files.find((f) => f.includes('index'))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')
    // chunk
    expect(content).toMatch(`new Worker("/assets`)
    // not inlined
    expect(content).not.toMatch(`new Worker("data:application/javascript`)

    const workers = files.filter((f) => f.includes('my-worker-1'))
    expect(workers.length).toBe(2)
    const moduleContent = fs.readFileSync(
      path.resolve(assetsDir, workers[0]),
      'utf-8'
    )
    const scriptContent = fs.readFileSync(
      path.resolve(assetsDir, workers[1]),
      'utf-8'
    )
    // module worker
    expect(moduleContent).toMatch(/import{.+}from".\/workerImport/)
    expect(scriptContent).not.toMatch('import')
  })
}
