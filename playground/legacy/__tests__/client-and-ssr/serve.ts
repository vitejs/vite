// this is automatically detected by playground/vitestSetup.ts and will replace
// the default e2e test serve behavior
import path from 'node:path'
import { ports, rootDir } from '~utils'

export const port = ports['legacy/client-and-ssr']

export async function serve(): Promise<{ close(): Promise<void> }> {
  const { build } = await import('vite')

  // In a CLI app it is possible that you may run `build` several times one after another
  // For example, you may want to override an option specifically for the SSR build
  // And you may have a CLI app built for that purpose to make a more concise API
  // An unexpected behaviour is for the plugin-legacy to override the process.env.NODE_ENV value
  // And any build after the first client build that called plugin-legacy will misbehave and
  // build with process.env.NODE_ENV=production, rather than your CLI's env: NODE_ENV=myWhateverEnv my-cli-app build
  // The issue is with plugin-legacy's index.ts file not explicitly passing mode: process.env.NODE_ENV to vite's build function
  // This causes vite to call resolveConfig with defaultMode = 'production' and mutate process.env.NODE_ENV to 'production'

  await build({
    mode: process.env.NODE_ENV,
    root: rootDir,
    logLevel: 'silent',
    build: {
      target: 'esnext',
      outDir: 'dist/client'
    }
  })

  await build({
    mode: process.env.NODE_ENV,
    root: rootDir,
    logLevel: 'silent',
    build: {
      target: 'esnext',
      ssr: 'entry-server-sequential.js',
      outDir: 'dist/server'
    }
  })

  const { default: express } = await import('express')
  const app = express()

  app.use('/', async (_req, res) => {
    const { render } = await import(
      path.resolve(rootDir, './dist/server/entry-server-sequential.mjs')
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
          }
        })
      })
    } catch (e) {
      reject(e)
    }
  })
}
