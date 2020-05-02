import path from 'path'
import chalk from 'chalk'
import resolve from 'resolve-from'
import { promises as fs } from 'fs'
import { Plugin } from './server'
import { resolveVue } from './resolveVue'
import { cachedRead } from './utils'

const debug = require('debug')('vite:resolve')

const idToEntryMap = new Map()
const idToFileMap = new Map()
const webModulesMap = new Map()

const moduleRE = /^\/@modules\//

const getDebugPath = (root: string, p: string) => {
  const relative = path.relative(root, p)
  return relative.startsWith('..') ? p : relative
}

// plugin for resolving /@modules/:id requests.
export const moduleResolvePlugin: Plugin = ({ root, app }) => {
  app.use(async (ctx, next) => {
    if (!moduleRE.test(ctx.path)) {
      return next()
    }

    const id = ctx.path.replace(moduleRE, '')
    ctx.type = 'js'

    const serve = async (id: string, file: string, type: string) => {
      idToFileMap.set(id, file)
      debug(`(${type}) ${id} -> ${getDebugPath(root, file)}`)
      // cached read sets etag, body and status on ctx so there is no need
      // to go further to other middlewares.
      await cachedRead(ctx, file)
    }

    // special handling for vue's runtime.
    if (id === 'vue') {
      return serve(id, resolveVue(root).browser, 'vue')
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
      return ctx.redirect(path.join(ctx.path, cachedEntry))
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
      return ctx.redirect(path.join(ctx.path, entryPoint))
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

async function resolveWebModule(
  root: string,
  id: string
): Promise<string | undefined> {
  const webModulePath = webModulesMap.get(id)
  if (webModulePath) {
    return webModulePath
  }
  const importMapPath = path.join(root, 'web_modules', 'import-map.json')
  if (await fs.stat(importMapPath).catch((e) => false)) {
    const importMap = require(importMapPath)
    if (importMap.imports) {
      const webModulesDir = path.dirname(importMapPath)
      Object.entries(
        importMap.imports
      ).forEach(([key, val]: [string, string]) =>
        webModulesMap.set(key, path.join(webModulesDir, val))
      )
      return webModulesMap.get(id)
    }
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
