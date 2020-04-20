const fs = require('fs')
const path = require('path')
const http = require('http')
const url = require('url')
const ws = require('ws')
const serve = require('serve-handler')
const vue = require('./vueMiddleware')
const { createFileWatcher } = require('./fileWatcher')
const { sendJS } = require('./utils')

const hmrProxy = fs.readFileSync(path.resolve(__dirname, './hmrProxy.js'))

const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname
  if (pathname === '/__hmrProxy') {
    sendJS(res, hmrProxy)
  } else if (pathname.endsWith('.vue')) {
    vue(req, res)
  } else {
    serve(req, res)
  }
})

const wss = new ws.Server({ server })
const sockets = new Set()
wss.on('connection', (socket) => {
  sockets.add(socket)
  socket.send(JSON.stringify({ type: 'connected'}))
  socket.on('close', () => {
    sockets.delete(socket)
  })
})

createFileWatcher((payload) =>
  sockets.forEach((s) => s.send(JSON.stringify(payload)))
)

server.listen(3000, () => {
  console.log('Running at http://localhost:3000')
})
