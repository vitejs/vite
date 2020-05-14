import path from 'path'
import chalk from 'chalk'
import { ServerPlugin } from '.'
import { resolveVue, cachedRead } from '../utils'
import { URL } from 'url'
import { resolveOptimizedModule, resolveNodeModule } from '../resolver'

const debug = require('debug')('vite:resolve')

export const idToFileMap = new Map()
export const fileToRequestMap = new Map()

export const moduleRE = /^\/@modules\//

const getDebugPath = (root: string, p: string) => {
  const relative = path.relative(root, p)
  return relative.startsWith('..') ? p : relative
}

// plugin for resolving /@modules/:id requests.
export const moduleResolvePlugin: ServerPlugin = ({ root, app, watcher }) => {
  app.use(async (ctx, next) => {
    if (!moduleRE.test(ctx.path)) {
      return next()
    }

    const id = ctx.path.replace(moduleRE, '')
    ctx.type = 'js'

    const serve = async (id: string, file: string, type: string) => {
      idToFileMap.set(id, file)
      fileToRequestMap.set(file, ctx.path)
      debug(`(${type}) ${id} -> ${getDebugPath(root, file)}`)
      await cachedRead(ctx, file)

      // resolved module file is outside of root dir, but is not in node_modules.
      // this is likely a linked monorepo/workspace, watch the file for HMR.
      if (!file.startsWith(root) && !/node_modules/.test(file)) {
        watcher.add(file)
      }
      await next()
    }

    // speical handling for vue runtime in case it's not installed
    if (id === 'vue') {
      const vuePath = resolveVue(root).vue
      if (vuePath) {
        return serve(id, vuePath, '(non-local vue)')
      }
    }

    // already resolved and cached
    const cachedPath = idToFileMap.get(id)
    if (cachedPath) {
      return serve(id, cachedPath, 'cached')
    }

    // resolve from vite optimized modules
    const optimized = resolveOptimizedModule(root, id)
    if (optimized) {
      return serve(id, optimized, 'optimized')
    }

    const nodeModulePath = resolveNodeModule(root, id)
    if (nodeModulePath) {
      return serve(id, nodeModulePath, 'node_modules')
    }

    const importer = new URL(ctx.get('referer')).pathname
    console.error(
      chalk.red(
        `[vite] Failed to resolve module import "${id}". ` +
          `(imported by ${importer})`
      )
    )
    ctx.status = 404
  })
}
