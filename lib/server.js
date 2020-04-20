const fs = require('fs').promises
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

exports.createServer = async ({ port = 3000 } = {}) => {
  const hmrClientCode = await fs.readFile(
    path.resolve(__dirname, './hmrClient.js')
  )

  const server = http.createServer(async (req, res) => {
    const pathname = url.parse(req.url).pathname
    if (pathname === '/__hmrClient') {
      return sendJS(res, await hmrClientCode)
    } else if (pathname.startsWith('/__modules/')) {
      return moduleMiddleware(pathname.replace('/__modules/', ''), res)
    } else if (pathname.endsWith('.vue')) {
      return vue(req, res)
    } else if (pathname.endsWith('.js')) {
      const filename = path.join(process.cwd(), pathname.slice(1))
      try {
        const content = await fs.readFile(filename, 'utf-8')
        return sendJS(res, rewrite(content))
      } catch (e) {
        if (e.code === 'ENOENT') {
          // fallthrough to serve-handler
        } else {
          console.error(e)
        }
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

  wss.on('error', (e) => {
    if (e.code !== 'EADDRINUSE') {
      console.error(e)
    }
  })

  createFileWatcher((payload) =>
    sockets.forEach((s) => s.send(JSON.stringify(payload)))
  )

  return new Promise((resolve, reject) => {
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`port ${port} is in use, trying another one...`)
        setTimeout(() => {
          server.close()
          server.listen(++port)
        }, 100)
      } else {
        console.error(e)
      }
    })

    server.on('listening', () => {
      console.log(`Running at http://localhost:${port}`)
      resolve()
    })

    server.listen(port)
  })
}
