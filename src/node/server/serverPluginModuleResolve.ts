import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import resolve from 'resolve-from'
import { ServerPlugin } from '.'
import { resolveVue, cachedRead } from '../utils'
import { URL } from 'url'
import { supportedExts } from '../resolver'

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

    // resolve from vite optimized modules
    const optimized = resolveOptimizedModule(root, id)
    if (optimized) {
      return serve(id, optimized, 'optimized')
    }

    // resolve from web_modules
    const webModulePath = resolveWebModule(root, id)
    if (webModulePath) {
      return serve(id, webModulePath, 'web_modules')
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

export function resolveBareModule(root: string, id: string) {
  const optimized = resolveOptimizedModule(root, id)
  if (optimized) {
    return id + '.js'
  }
  const web = resolveWebModule(root, id)
  if (web) {
    return id + '.js'
  }
  const nodeEntry = resolveNodeModule(root, id)
  if (nodeEntry) {
    return nodeEntry
  }
  return id
}

const viteOptimizedMap = new Map()

export function resolveOptimizedModule(
  root: string,
  id: string
): string | undefined {
  const cached = viteOptimizedMap.get(id)
  if (cached) {
    return cached
  }

  if (!id.endsWith('.js')) id += '.js'
  const file = path.join(root, `node_modules`, `.vite`, id)
  if (fs.existsSync(file)) {
    viteOptimizedMap.set(id, file)
    return file
  }
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

const nodeModulesMap = new Map()

function resolveNodeModule(root: string, id: string): string | undefined {
  const cached = nodeModulesMap.get(id)
  if (cached) {
    return cached
  }

  let pkgPath
  try {
    // see if the id is a valid package name
    pkgPath = resolve(root, `${id}/package.json`)
  } catch (e) {}

  if (pkgPath) {
    // if yes, this is a entry import. resolve entry file
    const pkg = require(pkgPath)
    const entryPoint = path.join(id, '/', pkg.module || pkg.main || 'index.js')
    debug(`(node_module entry) ${id} -> ${entryPoint}`)
    nodeModulesMap.set(id, entryPoint)
    return entryPoint
  } else {
    // possibly a deep import
    try {
      return resolve(root, id)
    } catch (e) {}

    // no match and no ext, try all exts
    if (!path.extname(id)) {
      for (const ext of supportedExts) {
        try {
          return resolve(root, id + ext)
        } catch (e) {}
      }
    }
  }
}
