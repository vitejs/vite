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
import { serviceWorkerPlugin } from './serverPluginServiceWorker'
import { htmlRewritePlugin } from './serverPluginHtml'
import { proxyPlugin } from './serverPluginProxy'
import { createCertificate } from '../utils/createCertificate'
import { cachedRead } from '../utils'
import { envPlugin } from './serverPluginEnv'
export { rewriteImports } from './serverPluginModuleRewrite'
import { sourceMapPlugin, SourceMap } from './serverPluginSourceMap'

export type ServerPlugin = (ctx: ServerPluginContext) => void

export interface ServerPluginContext {
  root: string
  app: Koa<State, Context>
  server: Server
  watcher: HMRWatcher
  resolver: InternalResolver
  config: ServerConfig & { __path?: string }
}

export interface State extends DefaultState {}

export type Context = DefaultContext &
  ServerPluginContext & {
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
    optimizeDeps = {}
  } = config

  const app = new Koa<State, Context>()
  const server = resolveServer(config, app.callback())
  const watcher = chokidar.watch(root, {
    ignored: [/\bnode_modules\b/, /\b\.git\b/]
  }) as HMRWatcher
  const resolver = createResolver(root, resolvers, alias)

  const context = {
    root,
    app,
    server,
    watcher,
    resolver,
    config,
    read: cachedRead
  }

  // attach server context to koa context
  app.use((ctx, next) => {
    Object.assign(ctx, context)
    return next()
  })

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
    serviceWorkerPlugin,
    hmrPlugin,
    ...(transforms.length || Object.keys(vueCustomBlockTransforms).length
      ? [createServerTransformPlugin(transforms, vueCustomBlockTransforms)]
      : []),
    vuePlugin,
    cssPlugin,
    esbuildPlugin,
    jsonPlugin,
    assetPathPlugin,
    serveStaticPlugin
  ]
  resolvedPlugins.forEach((m) => m(context))

  const listen = server.listen.bind(server)
  server.listen = (async (...args: any[]) => {
    if (optimizeDeps.auto !== false) {
      await require('../optimizer').optimizeDeps(config)
    }
    return listen(...args)
  }) as any

  return server
}

function resolveServer(
  { https = false, httpsOption = {} }: ServerConfig,
  requestListener: RequestListener
) {
  if (https) {
    return require('https').createServer(
      resolveHttpsConfig(httpsOption),
      requestListener
    )
  } else {
    return require('http').createServer(requestListener)
  }
}

function resolveHttpsConfig(httpsOption: ServerOptions) {
  const { ca, cert, key, pfx } = httpsOption
  Object.assign(httpsOption, {
    ca: readFileIfExits(ca),
    cert: readFileIfExits(cert),
    key: readFileIfExits(key),
    pfx: readFileIfExits(pfx)
  })
  if (!httpsOption.key || !httpsOption.cert) {
    httpsOption.cert = httpsOption.key = createCertificate()
  }
  return httpsOption
}

function readFileIfExits(value?: string | Buffer | any) {
  if (value && !Buffer.isBuffer(value)) {
    try {
      return fs.readFileSync(path.resolve(value as string))
    } catch (e) {
      return value
    }
  }
  return value
}
