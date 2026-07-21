import fs from 'node:fs'
import path from 'node:path'
import sirv from 'sirv'
import compression from '@polka/compression'
import chokidar from 'chokidar'
import connect from 'connect'
import corsMiddleware from 'cors'
import colors from 'picocolors'
import { disableCache } from '@voidzero-dev/vite-task-client'
import type { FSWatcher, WatchOptions } from '#dep-types/chokidar'
import type { Connect } from '#dep-types/connect'
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
  getServerUrlByHost,
  joinUrlSegments,
  normalizePath,
  resolveHostname,
  resolveServerUrls,
  setupSIGTERMListener,
  shouldServeFile,
  teardownSIGTERMListener,
} from './utils'
import { printServerUrls } from './logger'
import { bindCLIShortcuts } from './shortcuts'
import type { BindCLIShortcutsOptions, ShortcutsState } from './shortcuts'
import { resolveConfig } from './config'
import type { InlineConfig, ResolvedConfig } from './config'
import { DEFAULT_PREVIEW_PORT } from './constants'
import type { RequiredExceptFor } from './typeUtils'
import { hostValidationMiddleware } from './server/middlewares/hostCheck'
import {
  BasicMinimalPluginContext,
  basePluginContextMeta,
} from './server/pluginContainer'
import type { MinimalPluginContextWithoutEnvironment } from './plugin'

/**
 * Internal path served by preview watch mode. The injected client polls it and
 * reloads the page when the returned token changes.
 */
const previewReloadPath = '/@vite/preview-reload'

export interface PreviewOptions extends CommonServerOptions {
  /**
   * Watch the output directory and trigger browser reloads on changes.
   */
  watch?: boolean | WatchOptions
}

export interface ResolvedPreviewOptions extends RequiredExceptFor<
  PreviewOptions,
  'host' | 'https' | 'proxy'
> {}

export function resolvePreviewOptions(
  preview: PreviewOptions | undefined,
  server: ResolvedServerOptions,
): ResolvedPreviewOptions {
  // The preview server inherits every CommonServerOption from the `server` config
  // except for the port to enable having both the dev and preview servers running
  // at the same time without extra configuration
  return {
    port: preview?.port ?? DEFAULT_PREVIEW_PORT,
    strictPort: preview?.strictPort ?? server.strictPort,
    host: preview?.host ?? server.host,
    allowedHosts: preview?.allowedHosts ?? server.allowedHosts,
    https: preview?.https ?? server.https,
    open: preview?.open ?? server.open,
    proxy: preview?.proxy ?? server.proxy,
    cors: preview?.cors ?? server.cors,
    headers: preview?.headers ?? server.headers,
    watch: preview?.watch ?? false,
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
  /**
   * File watcher used by preview watch mode.
   * @internal
   */
  watcher?: FSWatcher
  /**
   * Reload client injected into preview HTML responses.
   * @internal
   */
  _reloadClientCode?: string
  /**
   * Resolves when the preview watcher has finished its initial scan.
   * @internal
   */
  _watcherReady?: Promise<void>
  /**
   * @internal
   */
  _shortcutsState?: ShortcutsState<PreviewServer>
}

export type PreviewServerHook = (
  this: MinimalPluginContextWithoutEnvironment,
  server: PreviewServer,
) => (() => void) | void | Promise<(() => void) | void>

/**
 * Starts the Vite server in preview mode, to simulate a production deployment
 */
export async function preview(
  inlineConfig: InlineConfig = {},
): Promise<PreviewServer> {
  // The preview server is a long-running, interactive process whose
  // responses cannot be replayed from a cache.
  disableCache()

  const config = await resolveConfig(
    inlineConfig,
    'serve',
    'production',
    'production',
    true,
  )

  const clientOutDir = config.environments.client.build.outDir
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

  const httpsOptions = await resolveHttpsConfig(config.preview.https)
  const app = connect() as Connect.Server
  const httpServer = await resolveHttpServer(app, httpsOptions)
  setClientErrorHandler(httpServer, config.logger)

  const options = config.preview
  const logger = config.logger
  const watchEnabled = options.watch !== false

  const closeHttpServer = createServerCloseFn(httpServer)
  const watcher = watchEnabled
    ? chokidar.watch(
        distDir,
        resolvePreviewWatchOptions(options.watch, config.server.watch),
      )
    : undefined
  const watcherReady = watcher
    ? new Promise<void>((resolve) => watcher.once('ready', () => resolve()))
    : undefined

  // Promise used by `server.close()` to ensure `closeServer()` is only called once
  let closeServerPromise: Promise<void> | undefined
  let reloadTimer: ReturnType<typeof setTimeout> | undefined
  // Token bumped on every output change. The injected client polls the
  // `previewReloadPath` endpoint and reloads the page when this changes.
  let reloadToken = 0
  const closeServer = async () => {
    teardownSIGTERMListener(closeServerAndExit)
    if (reloadTimer) {
      clearTimeout(reloadTimer)
      reloadTimer = undefined
    }
    await watcher?.close()
    await closeHttpServer()
    server.resolvedUrls = null
  }

  const scheduleReload = (file: string) => {
    if (reloadTimer) {
      clearTimeout(reloadTimer)
    }
    reloadTimer = setTimeout(() => {
      reloadTimer = undefined
      reloadToken++
      logger.info(
        colors.green(`page reload `) +
          colors.dim(normalizePath(path.relative(config.root, file))),
        { timestamp: true },
      )
    }, 50)
  }

  watcher?.on('add', scheduleReload)
  watcher?.on('change', scheduleReload)
  watcher?.on('unlink', scheduleReload)

  const server: PreviewServer = {
    config,
    middlewares: app,
    httpServer,
    watcher,
    _reloadClientCode: watchEnabled
      ? getPreviewReloadClientCode(config)
      : undefined,
    _watcherReady: watcherReady,
    async close() {
      if (!closeServerPromise) {
        closeServerPromise = closeServer()
      }
      return closeServerPromise
    },
    resolvedUrls: null,
    printUrls() {
      if (server.resolvedUrls) {
        printServerUrls(server.resolvedUrls, options.host, logger.info)
      } else {
        throw new Error('Cannot print server URLs before server is listening.')
      }
    },
    bindCLIShortcuts(options) {
      bindCLIShortcuts(server as PreviewServer, options)
    },
  }

  const closeServerAndExit = async (_: unknown, exitCode?: number) => {
    try {
      await server.close()
    } finally {
      process.exitCode ??= exitCode ? 128 + exitCode : undefined
      process.exit()
    }
  }

  setupSIGTERMListener(closeServerAndExit)

  // cors
  const { cors } = config.preview
  if (cors !== false) {
    app.use(corsMiddleware(typeof cors === 'boolean' ? {} : cors))
  }

  // host check (to prevent DNS rebinding attacks)
  const { allowedHosts } = config.preview
  // no need to check for HTTPS as HTTPS is not vulnerable to DNS rebinding attacks
  if (allowedHosts !== true && !config.preview.https) {
    app.use(hostValidationMiddleware(allowedHosts, true))
  }

  // apply server hooks from plugins
  const configurePreviewServerContext = new BasicMinimalPluginContext(
    { ...basePluginContextMeta, watchMode: false },
    config.logger,
  )
  const postHooks: ((() => void) | void)[] = []
  for (const hook of config.getSortedPluginHooks('configurePreviewServer')) {
    postHooks.push(await hook.call(configurePreviewServerContext, server))
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

  // preview watch mode: serve the current reload token so that the injected
  // client can poll it and reload the page when the output directory changes
  if (watchEnabled) {
    app.use(function previewReloadMiddleware(req, res, next) {
      if (req.url !== previewReloadPath) {
        return next()
      }
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Cache-Control', 'no-cache')
      res.end(String(reloadToken))
    })
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
    const normalizedDistDir = normalizePath(distDir)
    app.use(indexHtmlMiddleware(normalizedDistDir, server))

    // handle 404s
    app.use(notFoundMiddleware())
  }

  const hostname = await resolveHostname(options.host)

  await httpServerStart(httpServer, {
    port: options.port,
    strictPort: options.strictPort,
    host: hostname.host,
    logger,
  })

  server.resolvedUrls = resolveServerUrls(
    httpServer,
    config.preview,
    hostname,
    httpsOptions,
    config,
  )

  if (options.open) {
    const url = getServerUrlByHost(server.resolvedUrls, options.host)
    if (url) {
      const path =
        typeof options.open === 'string' ? new URL(options.open, url).href : url
      openBrowser(path, true, logger)
    }
  }

  return server as PreviewServer
}

function resolvePreviewWatchOptions(
  previewWatch: ResolvedPreviewOptions['watch'],
  serverWatch: ResolvedServerOptions['watch'],
): WatchOptions {
  const watchOptions =
    typeof previewWatch === 'object'
      ? previewWatch
      : serverWatch == null
        ? {}
        : serverWatch

  return {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    disableGlobbing: true,
    ...watchOptions,
  }
}

function getPreviewReloadClientCode(config: ResolvedConfig): string {
  const endpoint = joinUrlSegments(config.base, previewReloadPath)

  // Poll a token endpoint instead of opening a WebSocket so that pages stay
  // eligible for the browser's back/forward cache.
  return /* js */ `
const endpoint = ${JSON.stringify(endpoint)};
const interval = 1000;
let currentToken;
async function ping() {
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) return;
    const token = await response.text();
    if (currentToken === undefined) {
      currentToken = token;
    } else if (token !== currentToken) {
      location.reload();
    }
  } catch {}
}
ping();
setInterval(ping, interval);
`
}
