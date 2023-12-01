import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { expect, test } from 'vitest'
import { createServer } from '../../server'
import { normalizePath } from '../../utils'

const root = fileURLToPath(new URL('./', import.meta.url))

async function createDevServer() {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    optimizeDeps: {
      disabled: true,
    },
  })
  server.pluginContainer.buildStart({})
  return server
}

test('ssrLoad', async () => {
  expect.assertions(1)
  const server = await createDevServer()
  const moduleRelativePath = '/fixtures/modules/has-invalid-import.js'
  const moduleAbsolutePath = normalizePath(path.join(root, moduleRelativePath))
  try {
    await server.ssrLoadModule(moduleRelativePath)
  } catch (e) {
    expect(e.message).toBe(
      `Failed to load url ./non-existent.js (resolved id: ./non-existent.js) in ${moduleAbsolutePath}. Does the file exist?`,
    )
  }
})

test('error has same instance', async () => {
  expect.assertions(3)
  const s = Symbol()

  const server = await createDevServer()
  try {
    await server.ssrLoadModule('/fixtures/modules/has-error.js')
  } catch (e) {
    expect(e[s]).toBeUndefined()
    e[s] = true
    expect(e[s]).toBe(true)
  }

  try {
    await server.ssrLoadModule('/fixtures/modules/has-error.js')
  } catch (e) {
    expect(e[s]).toBe(true)
  }
})
