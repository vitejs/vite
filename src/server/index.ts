import http, { Server } from 'http'
import Koa from 'koa'
import chokidar, { FSWatcher } from 'chokidar'
import { modulesPlugin } from './plugins/modules'
import { vuePlugin } from './plugins/vue'
import { hmrPlugin } from './plugins/hmr'
import { servePlugin } from './plugins/serve'

export type Plugin = (ctx: PluginContext) => void

export interface PluginContext {
  root: string
  app: Koa
  server: Server
  watcher: FSWatcher
}

export interface ServerConfig {
  root?: string
  plugins?: Plugin[]
}

const internalPlugins: Plugin[] = [
  modulesPlugin,
  vuePlugin,
  hmrPlugin,
  servePlugin
]

export function createServer({
  root = process.cwd(),
  plugins = []
}: ServerConfig = {}): Server {
  const app = new Koa()
  const server = http.createServer(app.callback())
  const watcher = chokidar.watch(root, {
    ignored: [/node_modules/]
  })

  ;[...plugins, ...internalPlugins].forEach((m) =>
    m({
      root,
      app,
      server,
      watcher
    })
  )

  return server
}
