import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { createServer } from '../../server'

test('resolve', async () => {
  const server = await createServer({
    clearScreen: false,
    configFile: false,
    root: fileURLToPath(new URL('.', import.meta.url)),
  })
  await server.pluginContainer.buildStart({})
  console.log(
    await server.pluginContainer.resolveId('@vitejs/test-mix-dep', undefined, {
      ssr: true,
    }),
  )
})
