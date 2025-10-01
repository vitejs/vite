// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'node:path'
import kill from 'kill-port'
import { ports, rootDir } from '~utils'

export const port = ports['ssr-webworker']

export async function serve(): Promise<{ close(): Promise<void> }> {
  await kill(port)

  // we build first, regardless of whether it's prod/build mode
  // because Vite doesn't support the concept of a "webworker server"
  const { build } = await import('vite')

  // worker build
  await build({
    root: rootDir,
    logLevel: 'silent',
    build: {
      target: 'esnext',
      ssr: 'src/entry-worker.jsx',
      outDir: 'dist/worker',
    },
  })

  const { createServer } = await import(path.resolve(rootDir, 'worker.js'))
  const { mf } = await createServer(port)

  return {
    // for test teardown
    async close() {
      await mf.dispose()
    },
  }
}
