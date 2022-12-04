// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior
import path from 'node:path'
import { ports, rootDir } from '~utils'

export const port = ports['legacy/ssr']

export async function serve(): Promise<{ close(): Promise<void> }> {
  const { build } = await import('vite')
  await build({
    root: rootDir,
    logLevel: 'silent',
    build: {
      target: 'esnext',
      ssr: 'entry-server.js',
      outDir: 'dist/server',
    },
  })

  const { default: express } = await import('express')
  const app = express()

  app.use('/', async (_req, res) => {
    const { render } = await import(
      path.resolve(rootDir, './dist/server/entry-server.mjs')
    )
    const html = await render()
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  })

  return new Promise((resolve, reject) => {
    try {
      const server = app.listen(port, () => {
        resolve({
          // for test teardown
          async close() {
            await new Promise((resolve) => {
              server.close(resolve)
            })
          },
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}
