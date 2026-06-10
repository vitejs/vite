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
  normalizePath,
  resolveHostname,
  resolveServerUrls,
  setupSIGTERMListener,
  shouldServeFile,
  teardownSIGTERMListener,
} from './utils'
import type { WebSocketServer } from './server/ws'
import { createWebSocketServer } from './server/ws'
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
   * Websocket server used by preview watch mode.
   * @internal
   */
  ws?: WebSocketServer
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
  const ws = watchEnabled
    ? createWebSocketServer(httpServer, config, httpsOptions)
    : undefined
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
  const closeServer = async () => {
    teardownSIGTERMListener(closeServerAndExit)
    if (reloadTimer) {
      clearTimeout(reloadTimer)
      reloadTimer = undefined
    }
    await watcher?.close()
    await ws?.close()
    await closeHttpServer()
    server.resolvedUrls = null
  }

  const scheduleReload = (file: string) => {
    if (!ws) return
    if (reloadTimer) {
      clearTimeout(reloadTimer)
    }
    reloadTimer = setTimeout(() => {
      reloadTimer = undefined
      ws.send({ type: 'full-reload', path: '*' })
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
    ws,
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
  const wsConfig =
    typeof config.server.ws === 'object' ? config.server.ws : undefined
  const wsPath = path.posix.join(
    getPreviewWebSocketBase(config),
    wsConfig?.path ?? '',
  )

  return /* js */ `
const protocol = ${JSON.stringify(wsConfig?.protocol ?? null)} || (location.protocol === 'https:' ? 'wss' : 'ws');
const host = ${JSON.stringify(wsConfig?.host ?? null)} || location.hostname;
const port = ${JSON.stringify(wsConfig?.clientPort ?? wsConfig?.port ?? null)} || location.port;
const socket = new WebSocket(
  protocol + '://' + host + (port ? ':' + port : '') + ${JSON.stringify(wsPath)} + ${JSON.stringify(`?token=${config.webSocketToken}`)},
  'vite-hmr',
);
socket.addEventListener('message', ({ data }) => {
  const payload = JSON.parse(data);
  if (payload.type === 'full-reload') {
    location.reload();
  }
});
`
}

function getPreviewWebSocketBase(config: ResolvedConfig): string {
  return config.rawBase === './' || config.rawBase === ''
    ? '/'
    : new URL(config.base, 'http://vite.invalid').pathname
}
