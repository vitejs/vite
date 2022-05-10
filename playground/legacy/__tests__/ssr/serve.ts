// this is automatically detected by scripts/vitestSetup.ts and will replace
// the default e2e test serve behavior
import path from 'path'
import { ports } from '../../../testUtils'

export const port = ports['legacy/ssr']

export async function serve(root: string, _isProd: boolean) {
  const { build } = require('vite')
  await build({
    root,
    logLevel: 'silent',
    build: {
      target: 'esnext',
      ssr: 'entry-server.js',
      outDir: 'dist/server'
    }
  })

  const express = require('express')
  const app = express()

  app.use('/', async (_req, res) => {
    const { render } = require(path.resolve(
      root,
      './dist/server/entry-server.js'
    ))
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
