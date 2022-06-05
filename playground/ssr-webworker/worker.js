import { fileURLToPath } from 'url'
import path from 'path'
import { Miniflare } from 'miniflare'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isTest = !!process.env.TEST

export async function createServer() {
  const mf = new Miniflare({
    scriptPath: path.resolve(__dirname, 'dist/worker/entry-worker.js')
  })

  const app = mf.createServer()

  return { app }
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(5173, () => {
      console.log('http://localhost:5173')
    })
  )
}
