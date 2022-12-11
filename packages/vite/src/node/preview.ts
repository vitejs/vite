import fs from 'node:fs'
import path from 'node:path'
import type * as http from 'node:http'
import sirv from 'sirv'
import connect from 'connect'
import type { Connect } from 'dep-types/connect'
import corsMiddleware from 'cors'
import type { ResolvedServerOptions, ResolvedServerUrls } from './server'
import type { CommonServerOptions } from './http'
import {
  httpServerStart,
  resolveHttpServer,
  resolveHttpsConfig,
  setClientErrorHandler,
} from './http'
import { openBrowser } from './server/openBrowser'
import compression from './server/middlewares/compression'
import { proxyMiddleware } from './server/middlewares/proxy'
import { resolveHostname, resolveServerUrls, shouldServe } from './utils'
import { printServerUrls } from './logger'
import { resolveConfig } from '.'
import type { InlineConfig, ResolvedConfig } from '.'

export interface PreviewOptions extends CommonServerOptions {}

export interface ResolvedPreviewOptions extends PreviewOptions {}

export function resolvePreviewOptions(
  preview: PreviewOptions | undefined,
  server: ResolvedServerOptions,
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
    headers: preview?.headers ?? server.headers,
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
   * The resolved urls Vite prints on the CLI
   */
  resolvedUrls: ResolvedServerUrls
  /**
   * Print server urls
   */
  printUrls(): void
}

export type PreviewServerHook = (
  this: void,
  server: {
    middlewares: Connect.Server
    httpServer: http.Server
  },
) => (() => void) | void | Promise<(() => void) | void>

/**
 * Starts the Vite server in preview mode, to simulate a production deployment
 */
export async function preview(
  inlineConfig: InlineConfig = {},
): Promise<PreviewServer> {
  const config = await resolveConfig(
    inlineConfig,
    'serve',
    'production',
    'production',
  )

  const distDir = path.resolve(config.root, config.build.outDir)
  if (!fs.existsSync(distDir)) {
    throw new Error(
      `"${config.build.outDir}" does not exist. Did you build your project?`,
    )
  }

  const app = connect() as Connect.Server
  const httpServer = await resolveHttpServer(
    config.preview,
    app,
    await resolveHttpsConfig(config.preview?.https),
  )
  setClientErrorHandler(httpServer, config.logger)

  // apply server hooks from plugins
  const postHooks: ((() => void) | void)[] = []
  for (const hook of config.getSortedPluginHooks('configurePreviewServer')) {
    postHooks.push(await hook({ middlewares: app, httpServer }))
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

  const previewBase =
    config.base === './' || config.base === '' ? '/' : config.base

  // static assets
  const headers = config.preview.headers
  const assetServer = sirv(distDir, {
    etag: true,
    dev: true,
    single: config.appType === 'spa',
    setHeaders(res) {
      if (headers) {
        for (const name in headers) {
          res.setHeader(name, headers[name]!)
        }
      }
    },
  })
  app.use(previewBase, async (req, res, next) => {
    if (shouldServe(req.url!, distDir)) {
      return assetServer(req, res, next)
    }
    next()
  })

  // apply post server hooks from plugins
  postHooks.forEach((fn) => fn && fn())

  const options = config.preview
  const hostname = await resolveHostname(options.host)
  const port = options.port ?? 4173
  const protocol = options.https ? 'https' : 'http'
  const logger = config.logger

  const serverPort = await httpServerStart(httpServer, {
    port,
    strictPort: options.strictPort,
    host: hostname.host,
    logger,
  })

  const resolvedUrls = await resolveServerUrls(
    httpServer,
    config.preview,
    config,
  )

  if (options.open) {
    const path = typeof options.open === 'string' ? options.open : previewBase
    openBrowser(
      path.startsWith('http')
        ? path
        : `${protocol}://${hostname.name}:${serverPort}${path}`,
      true,
      logger,
    )
  }

  return {
    config,
    httpServer,
    resolvedUrls,
    printUrls() {
      printServerUrls(resolvedUrls, options.host, logger.info)
    },
  }
}
