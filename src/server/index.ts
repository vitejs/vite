import http, { Server } from 'http'
import https from 'https'
import Koa from 'koa'
import { hmrMiddleware } from './middlewares/hmr'
import { moduleResolverMiddleware } from './middlewares/modules'
import { vueMiddleware } from './middlewares/vue'
import { serveMiddleware } from './middlewares/serve'
import { historyFallbackMiddleware } from './middlewares/historyFallback'

export type Middleware = (ctx: MiddlewareCtx) => void

export interface MiddlewareCtx {
  cwd: string
  app: Koa
  server: Server
}

export interface ServerConfig {
  cwd?: string
  https?: boolean
  middlewares?: Middleware[]
}

const middlewares: Middleware[] = [
  hmrMiddleware,
  moduleResolverMiddleware,
  vueMiddleware,
  historyFallbackMiddleware,
  serveMiddleware
]

export function createServer({
  cwd = process.cwd(),
  middlewares: userMiddlewares = [],
  https: useHttps = false
}: ServerConfig = {}): Server {
  const app = new Koa()
  const server = useHttps
    ? https.createServer(app.callback())
    : http.createServer(app.callback())

  ;[...userMiddlewares, ...middlewares].forEach((m) =>
    m({
      cwd,
      app,
      server
    })
  )

  return server
}
