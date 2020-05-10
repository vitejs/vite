import http, { Server } from 'http'
import Koa from 'koa'
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

export { rewriteImports } from './serverPluginModuleRewrite'

export type ServerPlugin = (ctx: ServerPluginContext) => void

export interface ServerPluginContext {
  root: string
  app: Koa
  server: Server
  watcher: HMRWatcher
  resolver: InternalResolver
  config: ServerConfig
}

const internalPlugins: ServerPlugin[] = [
  hmrPlugin,
  moduleRewritePlugin,
  moduleResolvePlugin,
  vuePlugin,
  esbuildPlugin,
  jsonPlugin,
  cssPlugin,
  assetPathPlugin,
  serveStaticPlugin
]

export function createServer(config: ServerConfig = {}): Server {
  const { root = process.cwd(), plugins = [], resolvers = [] } = config
  const app = new Koa()
  const server = http.createServer(app.callback())
  const watcher = chokidar.watch(root, {
    ignored: [/node_modules/]
  }) as HMRWatcher
  const resolver = createResolver(root, resolvers)
  const context = {
    root,
    app,
    server,
    watcher,
    resolver,
    config
  }

  ;[...plugins, ...internalPlugins].forEach((m) => m(context))

  return server
}
