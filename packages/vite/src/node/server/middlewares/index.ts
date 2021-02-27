import compression from 'compression'
import history from 'connect-history-api-fallback'
import corsMiddleware from 'cors'
import fs from 'fs'
import * as http from 'http'
import launchEditorMiddleware from 'launch-editor-middleware'
import path from 'path'
import sirv from 'sirv'
import { Connect } from 'types/connect'
import { ViteDevServer } from '..'
import { ResolvedConfig } from '../..'
import { createDebugger } from '../../utils'
import { baseMiddleware } from './base'
import { errorMiddleware } from './error'
import { indexHtmlMiddleware } from './indexHtml'
import { proxyMiddleware } from './proxy'
import {
  servePublicMiddleware,
  serveRawFsMiddleware,
  serveStaticMiddleware
} from './static'
import { timeMiddleware } from './time'
import { transformMiddleware } from './transform'

export function createCommonMiddlewares(
  server: http.Server | null,
  config: ResolvedConfig,
  middlewares: Connect.Server
): void {
  const serverConfig = config.server || {}

  // request timer
  if (process.env.DEBUG) {
    middlewares.use(timeMiddleware(config.root))
  }

  // cors (enabled by default)
  const { cors } = serverConfig
  if (cors !== false) {
    middlewares.use(corsMiddleware(typeof cors === 'boolean' ? {} : cors))
  }

  // proxy
  const { proxy } = serverConfig
  if (proxy) {
    middlewares.use(proxyMiddleware(server, config))
  }
}

export function createServeMiddlewares(
  server: http.Server | null,
  config: ResolvedConfig,
  middlewares: Connect.Server
): void {
  createCommonMiddlewares(server, config, middlewares)

  middlewares.use(compression())

  const distDir = path.resolve(config.root, config.build.outDir)
  middlewares.use(
    config.base,
    sirv(distDir, {
      etag: true,
      single: true
    })
  )
}

export function createDevMiddlewares(
  server: ViteDevServer,
  config: ResolvedConfig,
  middlewares: Connect.Server
): void {
  createCommonMiddlewares(server.httpServer, config, middlewares)

  const serverConfig = config.server || {}
  const middlewareMode = !!serverConfig.middlewareMode

  // base
  if (config.base !== '/') {
    middlewares.use(baseMiddleware(server))
  }

  // open in editor support
  middlewares.use('/__open-in-editor', launchEditorMiddleware())

  // hmr reconnect ping
  middlewares.use('/__vite_ping', (_, res) => res.end('pong'))

  // serve static files under /public
  // this applies before the transform middleware so that these files are served
  // as-is without transforms.
  middlewares.use(servePublicMiddleware(config.publicDir))

  // main transform middleware
  middlewares.use(transformMiddleware(server))

  // serve static files
  middlewares.use(serveRawFsMiddleware())
  middlewares.use(serveStaticMiddleware(config.root, config))

  // spa fallback
  if (!middlewareMode) {
    middlewares.use(
      history({
        logger: createDebugger('vite:spa-fallback'),
        // support /dir/ without explicit index.html
        rewrites: [
          {
            from: /\/$/,
            to({ parsedUrl }: any) {
              const rewritten = parsedUrl.pathname + 'index.html'
              if (fs.existsSync(path.join(config.root, rewritten))) {
                return rewritten
              } else {
                return `/index.html`
              }
            }
          }
        ]
      })
    )
  }

  if (!middlewareMode) {
    // transform index.html
    middlewares.use(indexHtmlMiddleware(server))
    // handle 404s
    middlewares.use((_, res) => {
      res.statusCode = 404
      res.end()
    })
  }

  // error handler
  middlewares.use(errorMiddleware(server, middlewareMode))
}
