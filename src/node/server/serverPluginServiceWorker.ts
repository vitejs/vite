import fs from 'fs'
import path from 'path'
import { ServerPlugin } from '.'

// TODO inject lockfile hash
// TODO use file content / lastModified hash instead of timestamp?

export const serviceWorkerPlugin: ServerPlugin = ({
  root,
  app,
  watcher,
  resolver,
  config
}) => {
  const enabledString =
    typeof config.serviceWorker === 'boolean'
      ? String(config.serviceWorker)
      : JSON.stringify(config.serviceWorker)

  let swScript = fs
    .readFileSync(path.resolve(__dirname, '../serviceWorker.js'), 'utf-8')
    .replace(/const __ENABLED__ =.*/, `const __ENABLED__ = ${enabledString}`)
    // make sure the sw cache is unique per project
    .replace(
      /const __PROJECT_ROOT__ =.*/,
      `const __PROJECT_ROOT__ = ${JSON.stringify(root)}`
    )
    // inject server start time so the sw cache is invalidated
    .replace(
      /const __SERVER_TIMESTAMP__ =.*/,
      `const __SERVER_TIMESTAMP__ = ${Date.now()}`
    )

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
    // expose config to cachedRead
    ctx.__serviceWorker = config.serviceWorker

    if (ctx.path === '/sw.js') {
      ctx.type = 'js'
      ctx.status = 200
      ctx.body = swScript
      return
    }
    return next()
  })
}
