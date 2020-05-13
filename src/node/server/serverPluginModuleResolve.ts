import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import resolve from 'resolve-from'
import { ServerPlugin } from '.'
import { resolveVue, cachedRead } from '../utils'

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

    // speical handling for vue runtime packages
    const vuePaths = resolveVue(root)
    if (id in vuePaths) {
      return serve(id, (vuePaths as any)[id], 'vue')
    }

    // already resolved and cached
    const cachedPath = idToFileMap.get(id)
    if (cachedPath) {
      return serve(id, cachedPath, 'cached')
    }

    // resolve from web_modules
    try {
      const webModulePath = resolveWebModule(root, id)
      if (webModulePath) {
        return serve(id, webModulePath, 'web_modules')
      }
    } catch (e) {
      console.error(
        chalk.red(`[vite] Error while resolving web_modules with id "${id}":`)
      )
      console.error(e)
      ctx.status = 404
    }

    // resolve from node_modules
    try {
      // we land here after a module entry redirect
      // or a direct deep import like 'foo/bar/baz.js'.
      const file = resolve(root, id)
      return serve(id, file, 'node_modules')
    } catch (e) {
      console.error(
        chalk.red(`[vite] Error while resolving node_modules with id "${id}":`)
      )
      console.error(e)
      ctx.status = 404
    }
  })
}

const webModulesMap = new Map()

export function resolveWebModule(root: string, id: string): string | undefined {
  const cached = webModulesMap.get(id)
  if (cached) {
    return cached
  }
  // id could be a common chunk
  if (!id.endsWith('.js')) id += '.js'
  const webModulePath = path.join(root, 'web_modules', id)
  if (fs.existsSync(webModulePath)) {
    webModulesMap.set(id, webModulePath)
    return webModulePath
  }
}

const idToEntryMap = new Map()

export function resolveNodeModuleEntry(
  root: string,
  id: string
): string | undefined {
  const cached = idToEntryMap.get(id)
  if (cached) {
    return cached
  }

  let pkgPath
  try {
    // see if the id is a valid package name
    pkgPath = resolve(root, `${id}/package.json`)
  } catch (e) {}

  if (pkgPath) {
    // if yes, resolve entry file
    const pkg = require(pkgPath)
    const entryPoint = id + '/' + (pkg.module || pkg.main || 'index.js')
    debug(`(node_module entry) ${id} -> ${entryPoint}`)
    idToEntryMap.set(id, entryPoint)
    return entryPoint
  }
}
