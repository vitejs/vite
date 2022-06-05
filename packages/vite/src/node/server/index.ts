import fs from 'fs'
import path from 'path'
import type * as net from 'net'
import type * as http from 'http'
import { performance } from 'perf_hooks'
import connect from 'connect'
import corsMiddleware from 'cors'
import colors from 'picocolors'
import chokidar from 'chokidar'
import type { FSWatcher, WatchOptions } from 'types/chokidar'
import type { Connect } from 'types/connect'
import launchEditorMiddleware from 'launch-editor-middleware'
import type { SourceMap } from 'rollup'
import type { CommonServerOptions } from '../http'
import { httpServerStart, resolveHttpServer, resolveHttpsConfig } from '../http'
import type { InlineConfig, ResolvedConfig } from '../config'
import { isDepsOptimizerEnabled, resolveConfig } from '../config'
import {
  isParentDirectory,
  mergeConfig,
  normalizePath,
  resolveHostname
} from '../utils'
import { ssrLoadModule } from '../ssr/ssrModuleLoader'
import { cjsSsrResolveExternals } from '../ssr/ssrExternal'
import {
  rebindErrorStacktrace,
  ssrRewriteStacktrace
} from '../ssr/ssrStacktrace'
import { ssrTransform } from '../ssr/ssrTransform'
import { getDepsOptimizer, initDepsOptimizer } from '../optimizer'
import { CLIENT_DIR } from '../constants'
import type { Logger } from '../logger'
import { printCommonServerUrls } from '../logger'
import { invalidatePackageData } from '../packages'
import type { PluginContainer } from './pluginContainer'
import { createPluginContainer } from './pluginContainer'
import type { WebSocketServer } from './ws'
import { createWebSocketServer } from './ws'
import { baseMiddleware } from './middlewares/base'
import { proxyMiddleware } from './middlewares/proxy'
import { spaFallbackMiddleware } from './middlewares/spaFallback'
import { transformMiddleware } from './middlewares/transform'
import {
  createDevHtmlTransformFn,
  indexHtmlMiddleware
} from './middlewares/indexHtml'
import {
  servePublicMiddleware,
  serveRawFsMiddleware,
  serveStaticMiddleware
} from './middlewares/static'
import { timeMiddleware } from './middlewares/time'
import { ModuleGraph } from './moduleGraph'
import { errorMiddleware, prepareError } from './middlewares/error'
import type { HmrOptions } from './hmr'
import { handleFileAddUnlink, handleHMRUpdate } from './hmr'
import { openBrowser } from './openBrowser'
import type { TransformOptions, TransformResult } from './transformRequest'
import { transformRequest } from './transformRequest'
import { searchForWorkspaceRoot } from './searchRoot'

export { searchForWorkspaceRoot } from './searchRoot'

export interface ServerOptions extends CommonServerOptions {
  /**
   * Configure HMR-specific options (port, host, path & protocol)
   */
  hmr?: HmrOptions | boolean
  /**
   * chokidar watch options
   * https://github.com/paulmillr/chokidar#api
   */
  watch?: WatchOptions
  /**
   * Create Vite dev server to be used as a middleware in an existing server
   */
  middlewareMode?: boolean | 'html' | 'ssr'
  /**
   * Prepend this folder to http requests, for use when proxying vite as a subfolder
   * Should start and end with the `/` character
   */
  base?: string
  /**
   * Options for files served via '/\@fs/'.
   */
  fs?: FileSystemServeOptions
  /**
   * Origin for the generated asset URLs.
   *
   * @example `http://127.0.0.1:8080`
   */
  origin?: string
  /**
   * Pre-transform known direct imports
   * @default true
   */
  preTransformRequests?: boolean
}

export interface ResolvedServerOptions extends ServerOptions {
  fs: Required<FileSystemServeOptions>
}

export interface FileSystemServeOptions {
  /**
   * Strictly restrict file accessing outside of allowing paths.
   *
   * Set to `false` to disable the warning
   *
   * @default true
   */
  strict?: boolean

  /**
   * Restrict accessing files outside the allowed directories.
   *
   * Accepts absolute path or a path relative to project root.
   * Will try to search up for workspace root by default.
   */
  allow?: string[]

  /**
   * Restrict accessing files that matches the patterns.
   *
   * This will have higher priority than `allow`.
   * Glob patterns are supported.
   *
   * @default ['.env', '.env.*', '*.crt', '*.pem']
   */
  deny?: string[]
}

export type ServerHook = (
  server: ViteDevServer
) => (() => void) | void | Promise<(() => void) | void>

export interface ViteDevServer {
  /**
   * The resolved vite config object
   */
  config: ResolvedConfig
  /**
   * A connect app instance.
   * - Can be used to attach custom middlewares to the dev server.
   * - Can also be used as the handler function of a custom http server
   *   or as a middleware in any connect-style Node.js frameworks
   *
   * https://github.com/senchalabs/connect#use-middleware
   */
  middlewares: Connect.Server
  /**
   * native Node http server instance
   * will be null in middleware mode
   */
  httpServer: http.Server | null
  /**
   * chokidar watcher instance
   * https://github.com/paulmillr/chokidar#api
   */
  watcher: FSWatcher
  /**
   * web socket server with `send(payload)` method
   */
  ws: WebSocketServer
  /**
   * Rollup plugin container that can run plugin hooks on a given file
   */
  pluginContainer: PluginContainer
  /**
   * Module graph that tracks the import relationships, url to file mapping
   * and hmr state.
   */
  moduleGraph: ModuleGraph
  /**
   * Programmatically resolve, load and transform a URL and get the result
   * without going through the http request pipeline.
   */
  transformRequest(
    url: string,
    options?: TransformOptions
  ): Promise<TransformResult | null>
  /**
   * Apply vite built-in HTML transforms and any plugin HTML transforms.
   */
  transformIndexHtml(
    url: string,
    html: string,
    originalUrl?: string
  ): Promise<string>
  /**
   * Transform module code into SSR format.
   */
  ssrTransform(
    code: string,
    inMap: SourceMap | null,
    url: string
  ): Promise<TransformResult | null>
  /**
   * Load a given URL as an instantiated module for SSR.
   */
  ssrLoadModule(
    url: string,
    opts?: { fixStacktrace?: boolean }
  ): Promise<Record<string, any>>
  /**
   * Returns a fixed version of the given stack
   */
  ssrRewriteStacktrace(stack: string): string
  /**
   * Mutates the given SSR error by rewriting the stacktrace
   */
  ssrFixStacktrace(e: Error): void
  /**
   * Start the server.
   */
  listen(port?: number, isRestart?: boolean): Promise<ViteDevServer>
  /**
   * Stop the server.
   */
  close(): Promise<void>
  /**
   * Print server urls
   */
  printUrls(): void
  /**
   * Restart the server.
   *
   * @param forceOptimize - force the optimizer to re-bundle, same as --force cli flag
   */
  restart(forceOptimize?: boolean): Promise<void>
  /**
   * @internal
   */
  _importGlobMap: Map<string, string[][]>
  /**
   * Deps that are externalized
   * @internal
   */
  _ssrExternals: string[] | null
  /**
   * @internal
   */
  _restartPromise: Promise<void> | null
  /**
   * @internal
   */
  _forceOptimizeOnRestart: boolean
  /**
   * @internal
   */
  _pendingRequests: Map<
    string,
    {
      request: Promise<TransformResult | null>
      timestamp: number
      abort: () => void
    }
  >
}

export async function createServer(
  inlineConfig: InlineConfig = {}
): Promise<ViteDevServer> {
  const config = await resolveConfig(inlineConfig, 'serve', 'development')
  const { root, server: serverConfig } = config
  const httpsOptions = await resolveHttpsConfig(
    config.server.https,
    config.cacheDir
  )
  let { middlewareMode } = serverConfig
  if (middlewareMode === true) {
    middlewareMode = 'ssr'
  }

  const middlewares = connect() as Connect.Server
  const httpServer = middlewareMode
    ? null
    : await resolveHttpServer(serverConfig, middlewares, httpsOptions)
  const ws = createWebSocketServer(httpServer, config, httpsOptions)

  const { ignored = [], ...watchOptions } = serverConfig.watch || {}
  const watcher = chokidar.watch(path.resolve(root), {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      ...(Array.isArray(ignored) ? ignored : [ignored])
    ],
    ignoreInitial: true,
    ignorePermissionErrors: true,
    disableGlobbing: true,
    ...watchOptions
  }) as FSWatcher

  const moduleGraph: ModuleGraph = new ModuleGraph((url, ssr) =>
    container.resolveId(url, undefined, { ssr })
  )

  const container = await createPluginContainer(config, moduleGraph, watcher)
  const closeHttpServer = createServerCloseFn(httpServer)

  // eslint-disable-next-line prefer-const
  let exitProcess: () => void

  const server: ViteDevServer = {
    config,
    middlewares,
    httpServer,
    watcher,
    pluginContainer: container,
    ws,
    moduleGraph,
    ssrTransform(code: string, inMap: SourceMap | null, url: string) {
      return ssrTransform(code, inMap, url, {
        json: { stringify: server.config.json?.stringify }
      })
    },
    transformRequest(url, options) {
      return transformRequest(url, server, options)
    },
    transformIndexHtml: null!, // to be immediately set
    async ssrLoadModule(url, opts?: { fixStacktrace?: boolean }) {
      await updateCjsSsrExternals(server)
      return ssrLoadModule(
        url,
        server,
        undefined,
        undefined,
        opts?.fixStacktrace
      )
    },
    ssrFixStacktrace(e) {
      if (e.stack) {
        const stacktrace = ssrRewriteStacktrace(e.stack, moduleGraph)
        rebindErrorStacktrace(e, stacktrace)
      }
    },
    ssrRewriteStacktrace(stack: string) {
      return ssrRewriteStacktrace(stack, moduleGraph)
    },
    listen(port?: number, isRestart?: boolean) {
      return startServer(server, port, isRestart)
    },
    async close() {
      process.off('SIGTERM', exitProcess)

      if (!middlewareMode && process.env.CI !== 'true') {
        process.stdin.off('end', exitProcess)
      }

      await Promise.all([
        watcher.close(),
        ws.close(),
        container.close(),
        closeHttpServer()
      ])
    },
    printUrls() {
      if (httpServer) {
        printCommonServerUrls(httpServer, config.server, config)
      } else {
        throw new Error('cannot print server URLs in middleware mode.')
      }
    },
    async restart(forceOptimize?: boolean) {
      if (!server._restartPromise) {
        server._forceOptimizeOnRestart = !!forceOptimize
        server._restartPromise = restartServer(server).finally(() => {
          server._restartPromise = null
          server._forceOptimizeOnRestart = false
        })
      }
      return server._restartPromise
    },

    _ssrExternals: null,
    _restartPromise: null,
    _importGlobMap: new Map(),
    _forceOptimizeOnRestart: false,
    _pendingRequests: new Map()
  }

  server.transformIndexHtml = createDevHtmlTransformFn(server)

  exitProcess = async () => {
    try {
      await server.close()
    } finally {
      process.exit()
    }
  }

  process.once('SIGTERM', exitProcess)

  if (!middlewareMode && process.env.CI !== 'true') {
    process.stdin.on('end', exitProcess)
  }

  const { packageCache } = config
  const setPackageData = packageCache.set.bind(packageCache)
  packageCache.set = (id, pkg) => {
    if (id.endsWith('.json')) {
      watcher.add(id)
    }
    return setPackageData(id, pkg)
  }

  watcher.on('change', async (file) => {
    file = normalizePath(file)
    if (file.endsWith('/package.json')) {
      return invalidatePackageData(packageCache, file)
    }
    // invalidate module graph cache on file change
    moduleGraph.onFileChange(file)
    if (serverConfig.hmr !== false) {
      try {
        await handleHMRUpdate(file, server)
      } catch (err) {
        ws.send({
          type: 'error',
          err: prepareError(err)
        })
      }
    }
  })

  watcher.on('add', (file) => {
    handleFileAddUnlink(normalizePath(file), server)
  })
  watcher.on('unlink', (file) => {
    handleFileAddUnlink(normalizePath(file), server)
  })

  if (!middlewareMode && httpServer) {
    httpServer.once('listening', () => {
      // update actual port since this may be different from initial value
      serverConfig.port = (httpServer.address() as net.AddressInfo).port
    })
  }

  // apply server configuration hooks from plugins
  const postHooks: ((() => void) | void)[] = []
  for (const plugin of config.plugins) {
    if (plugin.configureServer) {
      postHooks.push(await plugin.configureServer(server))
    }
  }

  // Internal middlewares ------------------------------------------------------

  // request timer
  if (process.env.DEBUG) {
    middlewares.use(timeMiddleware(root))
  }

  // cors (enabled by default)
  const { cors } = serverConfig
  if (cors !== false) {
    middlewares.use(corsMiddleware(typeof cors === 'boolean' ? {} : cors))
  }

  // proxy
  const { proxy } = serverConfig
  if (proxy) {
    middlewares.use(proxyMiddleware(httpServer, proxy, config))
  }

  // base
  if (config.base !== '/') {
    middlewares.use(baseMiddleware(server))
  }

  // open in editor support
  middlewares.use('/__open-in-editor', launchEditorMiddleware())

  // serve static files under /public
  // this applies before the transform middleware so that these files are served
  // as-is without transforms.
  if (config.publicDir) {
    middlewares.use(servePublicMiddleware(config.publicDir))
  }

  // main transform middleware
  middlewares.use(transformMiddleware(server))

  // serve static files
  middlewares.use(serveRawFsMiddleware(server))
  middlewares.use(serveStaticMiddleware(root, server))

  const isMiddlewareMode = middlewareMode && middlewareMode !== 'html'

  // spa fallback
  if (config.spa && !isMiddlewareMode) {
    middlewares.use(spaFallbackMiddleware(root))
  }

  // run post config hooks
  // This is applied before the html middleware so that user middleware can
  // serve custom content instead of index.html.
  postHooks.forEach((fn) => fn && fn())

  if (config.spa && !isMiddlewareMode) {
    // transform index.html
    middlewares.use(indexHtmlMiddleware(server))
  }

  if (!isMiddlewareMode) {
    // handle 404s
    // Keep the named function. The name is visible in debug logs via `DEBUG=connect:dispatcher ...`
    middlewares.use(function vite404Middleware(_, res) {
      res.statusCode = 404
      res.end()
    })
  }

  // error handler
  middlewares.use(errorMiddleware(server, !!middlewareMode))

  const initOptimizer = async () => {
    if (isDepsOptimizerEnabled(config)) {
      await initDepsOptimizer(config, server)
    }
  }

  if (!middlewareMode && httpServer) {
    let isOptimized = false
    // overwrite listen to init optimizer before server start
    const listen = httpServer.listen.bind(httpServer)
    httpServer.listen = (async (port: number, ...args: any[]) => {
      if (!isOptimized) {
        try {
          await container.buildStart({})
          await initOptimizer()
          isOptimized = true
        } catch (e) {
          httpServer.emit('error', e)
          return
        }
      }
      return listen(port, ...args)
    }) as any
  } else {
    await container.buildStart({})
    await initOptimizer()
  }

  return server
}

async function startServer(
  server: ViteDevServer,
  inlinePort?: number,
  isRestart: boolean = false
): Promise<ViteDevServer> {
  const httpServer = server.httpServer
  if (!httpServer) {
    throw new Error('Cannot call server.listen in middleware mode.')
  }

  const options = server.config.server
  const port = inlinePort ?? options.port ?? 5173
  const hostname = resolveHostname(options.host)

  const protocol = options.https ? 'https' : 'http'
  const info = server.config.logger.info
  const base = server.config.base

  const serverPort = await httpServerStart(httpServer, {
    port,
    strictPort: options.strictPort,
    host: hostname.host,
    logger: server.config.logger
  })

  // @ts-ignore
  const profileSession = global.__vite_profile_session
  if (profileSession) {
    profileSession.post('Profiler.stop', (err: any, { profile }: any) => {
      // Write profile to disk, upload, etc.
      if (!err) {
        const outPath = path.resolve('./vite-profile.cpuprofile')
        fs.writeFileSync(outPath, JSON.stringify(profile))
        info(
          colors.yellow(
            `  CPU profile written to ${colors.white(colors.dim(outPath))}\n`
          )
        )
      } else {
        throw err
      }
    })
  }

  if (options.open && !isRestart) {
    const path = typeof options.open === 'string' ? options.open : base
    openBrowser(
      path.startsWith('http')
        ? path
        : `${protocol}://${hostname.name}:${serverPort}${path}`,
      true,
      server.config.logger
    )
  }

  return server
}

function createServerCloseFn(server: http.Server | null) {
  if (!server) {
    return () => {}
  }

  let hasListened = false
  const openSockets = new Set<net.Socket>()

  server.on('connection', (socket) => {
    openSockets.add(socket)
    socket.on('close', () => {
      openSockets.delete(socket)
    })
  })

  server.once('listening', () => {
    hasListened = true
  })

  return () =>
    new Promise<void>((resolve, reject) => {
      openSockets.forEach((s) => s.destroy())
      if (hasListened) {
        server.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      } else {
        resolve()
      }
    })
}

function resolvedAllowDir(root: string, dir: string): string {
  return normalizePath(path.resolve(root, dir))
}

export function resolveServerOptions(
  root: string,
  raw: ServerOptions | undefined,
  logger: Logger
): ResolvedServerOptions {
  const server: ResolvedServerOptions = {
    preTransformRequests: true,
    ...(raw as ResolvedServerOptions)
  }
  let allowDirs = server.fs?.allow
  const deny = server.fs?.deny || ['.env', '.env.*', '*.{crt,pem}']

  if (!allowDirs) {
    allowDirs = [searchForWorkspaceRoot(root)]
  }

  allowDirs = allowDirs.map((i) => resolvedAllowDir(root, i))

  // only push client dir when vite itself is outside-of-root
  const resolvedClientDir = resolvedAllowDir(root, CLIENT_DIR)
  if (!allowDirs.some((dir) => isParentDirectory(dir, resolvedClientDir))) {
    allowDirs.push(resolvedClientDir)
  }

  server.fs = {
    strict: server.fs?.strict ?? true,
    allow: allowDirs,
    deny
  }

  if (server.origin?.endsWith('/')) {
    server.origin = server.origin.slice(0, -1)
    logger.warn(
      colors.yellow(
        `${colors.bold('(!)')} server.origin should not end with "/". Using "${
          server.origin
        }" instead.`
      )
    )
  }

  return server
}

async function restartServer(server: ViteDevServer) {
  // @ts-ignore
  global.__vite_start_time = performance.now()
  const { port: prevPort, host: prevHost } = server.config.server

  await server.close()

  let inlineConfig = server.config.inlineConfig
  if (server._forceOptimizeOnRestart) {
    inlineConfig = mergeConfig(inlineConfig, {
      server: {
        force: true
      }
    })
  }

  let newServer = null
  try {
    newServer = await createServer(inlineConfig)
  } catch (err: any) {
    server.config.logger.error(err.message, {
      timestamp: true
    })
    return
  }

  for (const key in newServer) {
    if (key === '_restartPromise') {
      // prevent new server `restart` function from calling
      // @ts-ignore
      newServer[key] = server[key]
    } else if (key !== 'app') {
      // @ts-ignore
      server[key] = newServer[key]
    }
  }

  const {
    logger,
    server: { port, host, middlewareMode }
  } = server.config
  if (!middlewareMode) {
    await server.listen(port, true)
    logger.info('server restarted.', { timestamp: true })
    if (port !== prevPort || host !== prevHost) {
      logger.info('')
      server.printUrls()
    }
  } else {
    logger.info('server restarted.', { timestamp: true })
  }

  // new server (the current server) can restart now
  newServer._restartPromise = null
}

async function updateCjsSsrExternals(server: ViteDevServer) {
  if (!server._ssrExternals) {
    let knownImports: string[] = []
    const depsOptimizer = getDepsOptimizer(server.config)
    if (depsOptimizer) {
      await depsOptimizer.scanProcessing
      knownImports = [
        ...Object.keys(depsOptimizer.metadata.optimized),
        ...Object.keys(depsOptimizer.metadata.discovered)
      ]
    }
    server._ssrExternals = cjsSsrResolveExternals(server.config, knownImports)
  }
}
