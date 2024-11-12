import fs from 'node:fs'
import path from 'node:path'
import sirv from 'sirv'
import compression from '@polka/compression'
import connect from 'connect'
import type { Connect } from 'dep-types/connect'
import corsMiddleware from 'cors'
import type {
  HttpServer,
  ResolvedServerOptions,
  ResolvedServerUrls,
} from './server'
import { createServerCloseFn } from './server'
import type { CommonServerOptions } from './http'
import {
  httpServerStart,
  resolveHttpServer,
  resolveHttpsConfig,
  setClientErrorHandler,
} from './http'
import { openBrowser } from './server/openBrowser'
import { baseMiddleware } from './server/middlewares/base'
import { htmlFallbackMiddleware } from './server/middlewares/htmlFallback'
import { indexHtmlMiddleware } from './server/middlewares/indexHtml'
import { notFoundMiddleware } from './server/middlewares/notFound'
import { proxyMiddleware } from './server/middlewares/proxy'
import {
  resolveHostname,
  resolveServerUrls,
  setupSIGTERMListener,
  shouldServeFile,
  teardownSIGTERMListener,
} from './utils'
import { printServerUrls } from './logger'
import { bindCLIShortcuts } from './shortcuts'
import type { BindCLIShortcutsOptions } from './shortcuts'
import { configDefaults, resolveConfig } from './config'
import type { InlineConfig, ResolvedConfig } from './config'

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
   * Stop the server.
   */
  close(): Promise<void>
  /**
   * A connect app instance.
   * - Can be used to attach custom middlewares to the preview server.
   * - Can also be used as the handler function of a custom http server
   *   or as a middleware in any connect-style Node.js frameworks
   *
   * https://github.com/senchalabs/connect#use-middleware
   */
  middlewares: Connect.Server
  /**
   * native Node http server instance
   */
  httpServer: HttpServer
  /**
   * The resolved urls Vite prints on the CLI (URL-encoded). Returns `null`
   * if the server is not listening on any port.
   */
  resolvedUrls: ResolvedServerUrls | null
  /**
   * Print server urls
   */
  printUrls(): void
  /**
   * Bind CLI shortcuts
   */
  bindCLIShortcuts(options?: BindCLIShortcutsOptions<PreviewServer>): void
}

export type PreviewServerHook = (
  this: void,
  server: PreviewServer,
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
    true,
  )

  const clientOutDir =
    config.environments.client.build.outDir ?? config.build.outDir
  const distDir = path.resolve(config.root, clientOutDir)
  if (
    !fs.existsSync(distDir) &&
    // error if no plugins implement `configurePreviewServer`
    config.plugins.every((plugin) => !plugin.configurePreviewServer) &&
    // error if called in CLI only. programmatic usage could access `httpServer`
    // and affect file serving
    process.argv[1]?.endsWith(path.normalize('bin/vite.js')) &&
    process.argv[2] === 'preview'
  ) {
    throw new Error(
      `The directory "${clientOutDir}" does not exist. Did you build your project?`,
    )
  }

  const app = connect() as Connect.Server
  const httpServer = await resolveHttpServer(
    config.preview,
    app,
    await resolveHttpsConfig(config.preview?.https),
  )
  setClientErrorHandler(httpServer, config.logger)

  const options = config.preview
  const logger = config.logger

  const closeHttpServer = createServerCloseFn(httpServer)

  const server: PreviewServer = {
    config,
    middlewares: app,
    httpServer,
    async close() {
      teardownSIGTERMListener(closeServerAndExit)
      await closeHttpServer()
      server.resolvedUrls = null
    },
    resolvedUrls: null,
    printUrls() {
      if (server.resolvedUrls) {
        printServerUrls(server.resolvedUrls, options.host, logger.info)
      } else {
        throw new Error('cannot print server URLs before server is listening.')
      }
    },
    bindCLIShortcuts(options) {
      bindCLIShortcuts(server as PreviewServer, options)
    },
  }

  const closeServerAndExit = async () => {
    try {
      await server.close()
    } finally {
      process.exit()
    }
  }

  setupSIGTERMListener(closeServerAndExit)

  // apply server hooks from plugins
  const postHooks: ((() => void) | void)[] = []
  for (const hook of config.getSortedPluginHooks('configurePreviewServer')) {
    postHooks.push(await hook(server))
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

  // base
  if (config.base !== '/') {
    app.use(baseMiddleware(config.rawBase, false))
  }

  // static assets
  const headers = config.preview.headers
  const viteAssetMiddleware = (...args: readonly [any, any?, any?]) =>
    sirv(distDir, {
      etag: true,
      dev: true,
      extensions: [],
      ignores: false,
      setHeaders(res) {
        if (headers) {
          for (const name in headers) {
            res.setHeader(name, headers[name]!)
          }
        }
      },
      shouldServe(filePath) {
        return shouldServeFile(filePath, distDir)
      },
    })(...args)

  app.use(viteAssetMiddleware)

  // html fallback
  if (config.appType === 'spa' || config.appType === 'mpa') {
    app.use(htmlFallbackMiddleware(distDir, config.appType === 'spa'))
  }

  // apply post server hooks from plugins
  postHooks.forEach((fn) => fn && fn())

  if (config.appType === 'spa' || config.appType === 'mpa') {
    // transform index.html
    app.use(indexHtmlMiddleware(distDir, server))

    // handle 404s
    app.use(notFoundMiddleware())
  }

  const hostname = await resolveHostname(options.host)
  const port = options.port ?? configDefaults.preview.port

  await httpServerStart(httpServer, {
    port,
    strictPort: options.strictPort,
    host: hostname.host,
    logger,
  })

  server.resolvedUrls = await resolveServerUrls(
    httpServer,
    config.preview,
    config,
  )

  if (options.open) {
    const url = server.resolvedUrls?.local[0] ?? server.resolvedUrls?.network[0]
    if (url) {
      const path =
        typeof options.open === 'string' ? new URL(options.open, url).href : url
      openBrowser(path, true, logger)
    }
  }

  return server as PreviewServer
}
