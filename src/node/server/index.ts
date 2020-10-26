import path from 'path'
import fs from 'fs-extra'
import { RequestListener, Server } from 'http'
import { ServerOptions } from 'https'
import Koa, { DefaultState, DefaultContext } from 'koa'
import chokidar from 'chokidar'
import { createResolver, InternalResolver } from '../resolver'
import { moduleRewritePlugin } from './serverPluginModuleRewrite'
import { moduleResolvePlugin } from './serverPluginModuleResolve'
import { vuePlugin } from './serverPluginVue'
import { hmrPlugin, HMRWatcher } from './serverPluginHmr'
import { serveStaticPlugin } from './serverPluginServeStatic'
import { jsonPlugin } from './serverPluginJson'
import { cssPlugin } from './serverPluginCss'
import { assetPathPlugin } from './serverPluginAssets'
import { esbuildPlugin } from './serverPluginEsbuild'
import { ServerConfig } from '../config'
import { createServerTransformPlugin } from '../transform'
import { htmlRewritePlugin } from './serverPluginHtml'
import { proxyPlugin } from './serverPluginProxy'
import { createCertificate } from '../utils/createCertificate'
import { cachedRead } from '../utils'
import { envPlugin } from './serverPluginEnv'
export { rewriteImports } from './serverPluginModuleRewrite'
import { sourceMapPlugin, SourceMap } from './serverPluginSourceMap'
import { webWorkerPlugin } from './serverPluginWebWorker'
import { wasmPlugin } from './serverPluginWasm'
import { clientPlugin } from './serverPluginClient'
import { AddressInfo } from 'net'

export type ServerPlugin = (ctx: ServerPluginContext) => void

export interface ServerPluginContext {
  root: string
  app: Koa<State, Context>
  server: Server
  watcher: HMRWatcher
  resolver: InternalResolver
  config: ServerConfig & { __path?: string }
  port: number
}

export interface State extends DefaultState {}

export type Context = DefaultContext &
  ServerPluginContext & {
    read: (filePath: string) => Promise<Buffer | string>
    map?: SourceMap | null
  }

export function createServer(config: ServerConfig): Server {
  const {
    root = process.cwd(),
    configureServer = [],
    resolvers = [],
    alias = {},
    transforms = [],
    vueCustomBlockTransforms = {},
    optimizeDeps = {},
    enableEsbuild = true,
    assetsInclude
  } = config

  const app = new Koa<State, Context>()
  const server = resolveServer(config, app.callback())
  const watcher = chokidar.watch(root, {
    ignored: [/node_modules/, /\.git/],
    // #610
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 10
    }
  }) as HMRWatcher
  const resolver = createResolver(root, resolvers, alias, assetsInclude)

  const context: ServerPluginContext = {
    root,
    app,
    server,
    watcher,
    resolver,
    config,
    // port is exposed on the context for hmr client connection
    // in case the files are served under a different port
    port: config.port || 3000
  }

  // attach server context to koa context
  app.use((ctx, next) => {
    Object.assign(ctx, context)
    ctx.read = cachedRead.bind(null, ctx)
    return next()
  })

  // cors
  if (config.cors) {
    app.use(
      require('@koa/cors')(typeof config.cors === 'boolean' ? {} : config.cors)
    )
  }

  const resolvedPlugins = [
    // rewrite and source map plugins take highest priority and should be run
    // after all other middlewares have finished
    sourceMapPlugin,
    moduleRewritePlugin,
    htmlRewritePlugin,
    // user plugins
    ...(Array.isArray(configureServer) ? configureServer : [configureServer]),
    envPlugin,
    moduleResolvePlugin,
    proxyPlugin,
    clientPlugin,
    hmrPlugin,
    ...(transforms.length || Object.keys(vueCustomBlockTransforms).length
      ? [
          createServerTransformPlugin(
            transforms,
            vueCustomBlockTransforms,
            resolver
          )
        ]
      : []),
    vuePlugin,
    cssPlugin,
    enableEsbuild ? esbuildPlugin : null,
    jsonPlugin,
    assetPathPlugin,
    webWorkerPlugin,
    wasmPlugin,
    serveStaticPlugin
  ]
  resolvedPlugins.forEach((m) => m && m(context))

  const listen = server.listen.bind(server)
  server.listen = (async (port: number, ...args: any[]) => {
    if (optimizeDeps.auto !== false) {
      await require('../optimizer').optimizeDeps(config)
    }
    return listen(port, ...args)
  }) as any

  server.once('listening', () => {
    context.port = (server.address() as AddressInfo).port
  })

  return server
}

function resolveServer(
  { https = false, httpsOptions = {}, proxy }: ServerConfig,
  requestListener: RequestListener
): Server {
  if (https) {
    if (proxy) {
      // #484 fallback to http1 when proxy is needed.
      return require('https').createServer(
        resolveHttpsConfig(httpsOptions),
        requestListener
      )
    } else {
      return require('http2').createSecureServer(
        {
          ...resolveHttpsConfig(httpsOptions),
          allowHTTP1: true
        },
        requestListener
      )
    }
  } else {
    return require('http').createServer(requestListener)
  }
}

function resolveHttpsConfig(httpsOption: ServerOptions) {
  const { ca, cert, key, pfx } = httpsOption
  Object.assign(httpsOption, {
    ca: readFileIfExists(ca),
    cert: readFileIfExists(cert),
    key: readFileIfExists(key),
    pfx: readFileIfExists(pfx)
  })
  if (!httpsOption.key || !httpsOption.cert) {
    httpsOption.cert = httpsOption.key = createCertificate()
  }
  return httpsOption
}

function readFileIfExists(value?: string | Buffer | any) {
  if (value && !Buffer.isBuffer(value)) {
    try {
      return fs.readFileSync(path.resolve(value as string))
    } catch (e) {
      return value
    }
  }
  return value
}
