import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { ServerPlugin } from '.'

export const serviceWorkerPlugin: ServerPlugin = ({
  root,
  app,
  watcher,
  resolver,
  config
}) => {
  // TODO use file content / lastModified hash instead of timestamp?

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
    .replace(
      /const __LOCKFILE_HASH__ =.*/,
      `const __LOCKFILE_HASH__ = ${JSON.stringify(getLockfileHash(root))}`
    )
    // inject server start time so the sw cache is invalidated
    .replace(
      /const __SERVER_ID__ =.*/,
      `const __SERVER_ID__ = ${config.serviceWorker ? Date.now() : '0'}`
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

const lockfileFormats = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'package.json'
]

function getLockfileHash(root: string): string {
  for (const format of lockfileFormats) {
    const fullPath = path.join(root, format)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      return createHash('sha1').update(content).digest('base64')
    }
  }
  return ``
}
