import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { ServerPlugin } from '.'
import chalk from 'chalk'

export const serviceWorkerPlugin: ServerPlugin = ({
  root,
  app,
  watcher,
  resolver,
  config
}) => {
  let enabled = config.serviceWorker
  if (typeof enabled === 'string' && enabled !== 'deps-only') {
    console.error(
      chalk.red(
        `[vite] options error: option "serviceWorker" only accepts true, ` +
          `false or "deps-only", but got "${enabled}"`
      )
    )
    enabled = config.serviceWorker = true
  }
  if (enabled == null) {
    enabled = config.serviceWorker = true
  }

  const enabledString =
    typeof enabled === 'boolean' ? String(enabled) : JSON.stringify(enabled)

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
    // inject server id so the sw cache is invalidated on restart.
    .replace(
      /const __SERVER_ID__ =.*/,
      `const __SERVER_ID__ = ${
        // only inject if caching user files. When caching deps only, only
        // the lockfile change invalidates the cache.
        config.serviceWorker === true ? Date.now() : '0'
      }`
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
    ctx.__serviceWorker = enabled

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
