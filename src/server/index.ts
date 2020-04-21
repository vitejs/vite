import http, { Server } from 'http'
import Koa from 'koa'
import { hmrMiddleware } from './middlewares/hmr'
import { moduleResolverMiddleware } from './middlewares/modules'
import { vueMiddleware } from './middlewares/vue'
import { serveMiddleware } from './middlewares/serve'

export type Middleware = (ctx: MiddlewareCtx) => void

export interface MiddlewareCtx {
  cwd: string
  app: Koa
  server: Server
}

export interface ServerConfig {
  port?: number
  cwd?: string
  middlewares?: Middleware[]
}

const middlewares: Middleware[] = [
  hmrMiddleware,
  moduleResolverMiddleware,
  vueMiddleware,
  serveMiddleware
]

export async function createServer({
  port = 3000,
  cwd = process.cwd(),
  middlewares: userMiddlewares = []
}: ServerConfig = {}): Promise<Server> {
  const app = new Koa()
  const server = http.createServer(app.callback())

  ;[...userMiddlewares, ...middlewares].forEach((m) =>
    m({
      cwd,
      app,
      server
    })
  )

  return new Promise((resolve, reject) => {
    server.on('error', (e: Error & { code: string }) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`port ${port} is in use, trying another one...`)
        setTimeout(() => {
          server.close()
          server.listen(++port)
        }, 100)
      } else {
        console.error(e)
        reject(e)
      }
    })

    server.on('listening', () => {
      console.log(`Running at http://localhost:${port}`)
      resolve(server)
    })

    server.listen(port)
  })
}
