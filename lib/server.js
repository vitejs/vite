const fs = require('fs')
const path = require('path')
const http = require('http')
const url = require('url')
const ws = require('ws')
const serve = require('serve-handler')
const vue = require('./vueMiddleware')
const { moduleMiddleware } = require('./moduleMiddleware')
const { createFileWatcher } = require('./hmrWatcher')
const { sendJS } = require('./utils')
const { rewrite } = require('./moduleRewriter')

const hmrClientCode = fs.readFileSync(path.resolve(__dirname, './hmrClient.js'))

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname
  if (pathname === '/__hmrClient') {
    return sendJS(res, hmrClientCode)
  } else if (pathname.startsWith('/__modules/')) {
    return moduleMiddleware(pathname.replace('/__modules/', ''), res)
  } else if (pathname.endsWith('.vue')) {
    return vue(req, res)
  } else if (pathname.endsWith('.js')) {
    const filename = path.join(process.cwd(), pathname.slice(1))
    if (fs.existsSync(filename)) {
      const content = rewrite(fs.readFileSync(filename, 'utf-8'))
      return sendJS(res, content)
    }
  }

  serve(req, res, {
    rewrites: [{ source: '**', destination: '/index.html' }]
  })
})

const wss = new ws.Server({ server })
const sockets = new Set()
wss.on('connection', (socket) => {
  sockets.add(socket)
  socket.send(JSON.stringify({ type: 'connected' }))
  socket.on('close', () => {
    sockets.delete(socket)
  })
})

createFileWatcher((payload) =>
  sockets.forEach((s) => s.send(JSON.stringify(payload)))
)

// TODO customized port
server.listen(3000, () => {
  console.log('Running at http://localhost:3000')
})
