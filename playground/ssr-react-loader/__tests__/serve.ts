// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'node:path'
import kill from 'kill-port'
import { hmrPorts, isBuild, ports, rootDir } from '~utils'

export const port = ports['ssr-react']

export async function serve(): Promise<{ close(): Promise<void> }> {
  if (isBuild) {
    // build first
    const { build } = await import('vite')
    // client build
    await build({
      root: rootDir,
      logLevel: 'silent', // exceptions are logged by Vitest
      build: {
        target: 'esnext',
        minify: false,
        ssrManifest: true,
        outDir: 'dist/client'
      }
    })
    // server build
    await build({
      root: rootDir,
      logLevel: 'silent',
      build: {
        target: 'esnext',
        ssr: 'src/entry-server.jsx',
        outDir: 'dist/server',
        rollupOptions: {
          output: {
            entryFileNames: 'entry-server.js'
          }
        }
      }
    })
  }

  await kill(port)

  const { createServer } = await import(path.resolve(rootDir, 'server.js'))
  const { app, vite } = await createServer(
    rootDir,
    isBuild,
    hmrPorts['ssr-react']
  )

  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        resolve({
          // for test teardown
          async close() {
            await new Promise((resolve) => {
              server.close(resolve)
            })
            if (vite) {
              await vite.close()
            }
          }
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}
