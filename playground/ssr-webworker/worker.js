// @ts-check
const path = require('path')
const { Miniflare } = require('miniflare')

const isTest = !!process.env.TEST

async function createServer() {
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

// for test use
exports.createServer = createServer
