import fs from 'fs'
import path from 'path'
import { ServerPlugin } from '.'

let swScript = fs
  .readFileSync(path.resolve(__dirname, '../serviceWorker.js'), 'utf-8')
  // inject server start time so the sw cache is invalidated
  .replace(/__SERVER_TIMESTAMP__ =.*/, `__SERVER_TIMESTAMP__ = ${Date.now()}`)

// TODO inject lockfile hash

// TODO resolve module entry directly during rewrite so that we don't need the
// redirect in module resolve plugin

export const serviceWorkerPlugin: ServerPlugin = ({
  app,
  watcher,
  resolver
}) => {
  if (process.env.DEBUG) {
    // enable console logs in debug mode
    swScript = swScript.replace(/\/\/ console.log/g, 'console.log')
  }

  // TODO watch lockfile hash

  // const bustSwCache = (file: string) => {
  //   // vue cache busting is handled in vue-specific client listeners
  //   // so we can invalidate each blocks separately
  //   if (!file.endsWith('.vue')) {
  //     watcher.send({
  //       type: 'sw-bust-cache',
  //       timestamp: Date.now(),
  //       path: resolver.fileToRequest(file)
  //     })
  //   }
  // }

  // watcher.on('change', bustSwCache)
  // watcher.on('unlink', bustSwCache)

  app.use(async (ctx, next) => {
    if (ctx.path === '/sw.js') {
      ctx.type = 'js'
      ctx.status = 200
      ctx.body = swScript
      return
    }
    return next()
  })
}
