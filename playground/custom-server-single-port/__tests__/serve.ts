// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior

import path from 'node:path'
import kill from 'kill-port'
import { ports, rootDir } from '~utils'

export const port = ports['custom-server-single-port']

export async function serve(): Promise<{ close(): Promise<void> }> {
  await kill(port)

  const { createServer } = await import(path.resolve(rootDir, 'server.js'))
  const { server, vite } = await createServer(rootDir)

  return new Promise((resolve, reject) => {
    try {
      server.listen(port, () => {
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
