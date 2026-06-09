// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'node:path'
import kill from 'kill-port'
import { build } from 'vite'
import { hmrPorts, isBuild, ports, rootDir } from '~utils'

export const port = ports['ssr-wasm']

export async function preServe() {
  if (isBuild) {
    await build({ root: rootDir, logLevel: 'silent' })
  }
}

export async function serve(): Promise<{ close(): Promise<void> }> {
  await kill(port)

  const { createServer } = await import(path.resolve(rootDir, 'server.js'))
  const { app, vite } = await createServer(rootDir, hmrPorts['ssr-wasm'])

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
          },
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}
