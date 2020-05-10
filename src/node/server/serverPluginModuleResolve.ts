import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import resolve from 'resolve-from'
import { ServerPlugin } from '.'
import { resolveVue, cachedRead } from '../utils'
import slash from 'slash'

const debug = require('debug')('vite:resolve')

const idToEntryMap = new Map()
export const idToFileMap = new Map()
export const fileToRequestMap = new Map()
const webModulesMap = new Map()

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

    // package entries need redirect to ensure correct relative import paths
    // check if the entry was already resolved
    const cachedEntry = idToEntryMap.get(id)
    if (cachedEntry) {
      debug(`(cached redirect) ${id} -> ${cachedEntry}`)
      return ctx.redirect(slash(path.join(ctx.path, cachedEntry)))
    }

    // resolve from web_modules
    try {
      const webModulePath = await resolveWebModule(root, id)
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

    const entryPoint = await resolveNodeModuleEntry(root, id)
    if (entryPoint) {
      return ctx.redirect(slash(path.join(ctx.path, entryPoint)))
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

export async function resolveWebModule(
  root: string,
  id: string
): Promise<string | undefined> {
  let webModulePath = webModulesMap.get(id)
  if (webModulePath) {
    return webModulePath
  }
  // id could be a common chunk
  if (!id.endsWith('.js')) id += '.js'
  webModulePath = path.join(root, 'web_modules', id)
  if (await fs.pathExists(webModulePath)) {
    webModulesMap.set(id, webModulePath)
    return webModulePath
  }
}

async function resolveNodeModuleEntry(
  root: string,
  id: string
): Promise<string | undefined> {
  let pkgPath
  try {
    // see if the id is a valid package name
    pkgPath = resolve(root, `${id}/package.json`)
  } catch (e) {}

  if (pkgPath) {
    // if yes, resolve entry file
    const pkg = require(pkgPath)
    const entryPoint = pkg.module || pkg.main || 'index.js'
    debug(`(redirect) ${id} -> ${entryPoint}`)
    idToEntryMap.set(id, entryPoint)
    return entryPoint
  }
}
