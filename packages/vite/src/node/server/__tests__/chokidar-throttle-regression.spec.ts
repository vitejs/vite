import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { createServer } from '../index'

const root = fileURLToPath(
  new URL('./fixtures/watcher/nested-root', import.meta.url),
)

it('should detect both file changes within 50ms', async () => {
  const server = await createServer({
    root,
    server: { watch: { ignored: [] } },
  })

  const testFile = path.join(root, 'test.txt')
  fs.writeFileSync(testFile, 'initial')
  server.watcher.add(testFile)

  await new Promise((resolve) => server.watcher.on('ready', resolve))

  const changes = []
  server.watcher.on('change', (p) => {
    if (path.normalize(p) === path.normalize(testFile)) {
      changes.push(p)
    }
  })

  fs.writeFileSync(testFile, '1')
  await new Promise((resolve) => setTimeout(resolve, 10))
  fs.writeFileSync(testFile, '2')

  await new Promise((resolve) => setTimeout(resolve, 500))

  expect(changes.length).toBe(2)

  await server.close()
  fs.unlinkSync(testFile)
})
