import fs from 'fs'
import path from 'path'
import { ServerPlugin } from '.'

// TODO inject lockfile hash

export const serviceWorkerPlugin: ServerPlugin = ({
  root,
  app,
  watcher,
  resolver
}) => {
  let swScript = fs
    .readFileSync(path.resolve(__dirname, '../serviceWorker.js'), 'utf-8')
    // make sure the sw cache is unique per project
    .replace(
      /__PROJECT_ROOT__ =.*/,
      `__PROJECT_ROOT__ = ${JSON.stringify(root)}`
    )
    // inject server start time so the sw cache is invalidated
    .replace(/__SERVER_TIMESTAMP__ =.*/, `__SERVER_TIMESTAMP__ = ${Date.now()}`)

  // enable console logs in debug mode
  if (process.env.DEBUG === 'vite:sw') {
    swScript = swScript.replace(/\/\/ console.log/g, 'console.log')
  }

  watcher.on('unlink', (file: string) => {
    watcher.send({
      type: 'sw-bust-cache',
      path: resolver.fileToRequest(file),
      timestamp: Date.now()
    })
  })

  // TODO watch lockfile hash
  // - update swScript
  // - notify the client to update the sw

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
