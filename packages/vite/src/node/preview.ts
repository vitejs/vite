import path from 'path'
import type * as http from 'http'
import sirv from 'sirv'
import connect from 'connect'
import type { Connect } from 'types/connect'
import corsMiddleware from 'cors'
import type { ResolvedServerOptions } from './server'
import type { CommonServerOptions } from './http'
import { httpServerStart, resolveHttpServer, resolveHttpsConfig } from './http'
import { openBrowser } from './server/openBrowser'
import compression from './server/middlewares/compression'
import { proxyMiddleware } from './server/middlewares/proxy'
import { resolveHostname } from './utils'
import { printCommonServerUrls } from './logger'
import { resolveConfig } from '.'
import type { InlineConfig, ResolvedConfig } from '.'

export interface PreviewOptions extends CommonServerOptions {}

export interface ResolvedPreviewOptions extends PreviewOptions {}

export function resolvePreviewOptions(
  preview: PreviewOptions | undefined,
  server: ResolvedServerOptions
): ResolvedPreviewOptions {
  // The preview server inherits every CommonServerOption from the `server` config
  // except for the port to enable having both the dev and preview servers running
  // at the same time without extra configuration
  return {
    port: preview?.port,
    strictPort: preview?.strictPort ?? server.strictPort,
    host: preview?.host ?? server.host,
    https: preview?.https ?? server.https,
    open: preview?.open ?? server.open,
    proxy: preview?.proxy ?? server.proxy,
    cors: preview?.cors ?? server.cors,
    headers: preview?.headers ?? server.headers
  }
}

export interface PreviewServer {
  /**
   * The resolved vite config object
   */
  config: ResolvedConfig
  /**
   * native Node http server instance
   */
  httpServer: http.Server
  /**
   * Print server urls
   */
  printUrls: () => void
}

export type PreviewServerHook = (server: {
  middlewares: Connect.Server
  httpServer: http.Server
}) => (() => void) | void | Promise<(() => void) | void>

/**
 * Starts the Vite server in preview mode, to simulate a production deployment
 */
export async function preview(
  inlineConfig: InlineConfig = {}
): Promise<PreviewServer> {
  const config = await resolveConfig(inlineConfig, 'serve', 'production')

  const app = connect() as Connect.Server
  const httpServer = await resolveHttpServer(
    config.preview,
    app,
    await resolveHttpsConfig(config.preview?.https, config.cacheDir)
  )

  // apply server hooks from plugins
  const postHooks: ((() => void) | void)[] = []
  for (const plugin of config.plugins) {
    if (plugin.configurePreviewServer) {
      postHooks.push(
        await plugin.configurePreviewServer({ middlewares: app, httpServer })
      )
    }
  }

  // cors
  const { cors } = config.preview
  if (cors !== false) {
    app.use(corsMiddleware(typeof cors === 'boolean' ? {} : cors))
  }

  // proxy
  const { proxy } = config.preview
  if (proxy) {
    app.use(proxyMiddleware(httpServer, proxy, config))
  }

  app.use(compression())

  // static assets
  const distDir = path.resolve(config.root, config.build.outDir)
  app.use(
    config.base,
    sirv(distDir, {
      etag: true,
      dev: true,
      single: config.spa
    })
  )

  // apply post server hooks from plugins
  postHooks.forEach((fn) => fn && fn())

  const options = config.preview
  const hostname = resolveHostname(options.host)
  const port = options.port ?? 4173
  const protocol = options.https ? 'https' : 'http'
  const logger = config.logger
  const base = config.base

  const serverPort = await httpServerStart(httpServer, {
    port,
    strictPort: options.strictPort,
    host: hostname.host,
    logger
  })

  if (options.open) {
    const path = typeof options.open === 'string' ? options.open : base
    openBrowser(
      path.startsWith('http')
        ? path
        : `${protocol}://${hostname.name}:${serverPort}${path}`,
      true,
      logger
    )
  }

  return {
    config,
    httpServer,
    printUrls() {
      printCommonServerUrls(httpServer, config.preview, config)
    }
  }
}
