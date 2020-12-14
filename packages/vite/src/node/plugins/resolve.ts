import fs from 'fs'
import path from 'path'
import { createDebugger } from '../utils'
import { Plugin, ResolvedConfig } from '..'
import chalk from 'chalk'
import { FILE_PREFIX } from '../constants'
import { isCSSProxy } from './css'

export const supportedExts = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
export const FAILED_RESOLVE = `__vite_failed_resolve__`

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true
})

export function resolvePlugin({ root }: ResolvedConfig): Plugin {
  return {
    name: 'vite:resolve',
    resolveId(id, importer) {
      const isCSSProxyId = isCSSProxy(id)
      if (isCSSProxyId) {
        id = id.slice(0, -3)
      }
      const restoreCSSProxy = (res: string) =>
        isCSSProxyId ? res + '.js' : res

      let res
      if (id.startsWith(FILE_PREFIX)) {
        // explicit fs paths that starts with /@fs/*
        // these are injected by the rewrite plugin so that the file can work
        // in the browser
        let fsPath = id.slice(FILE_PREFIX.length - 1)
        if (fsPath.startsWith('//')) fsPath = fsPath.slice(1)
        res = tryFsResolve(fsPath)
        isDebug && debug(`[@fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        // always return here even if res doesn't exist since /@fs/ is explicit
        // if the file doesn't exist it should be a 404
        return restoreCSSProxy(res || fsPath)
      }

      // URL
      // /foo -> /fs-root/foo
      if (id.startsWith('/')) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[url] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return restoreCSSProxy(res)
        }
      }

      // relative
      if (id.startsWith('.') && importer && path.isAbsolute(importer)) {
        const fsPath = path.resolve(path.dirname(importer), id)
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[relative] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return restoreCSSProxy(res)
        }
      }

      // absolute fs paths
      if (path.isAbsolute(id) && (res = tryFsResolve(id))) {
        isDebug && debug(`[fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        return restoreCSSProxy(res)
      }

      // if this is not a bare import (package), it's a failed resolve and
      // should propagate into an error sent to the client.
      if (!/^[@\w]/.test(id)) {
        return FAILED_RESOLVE
      }

      // fallthrough to node-resolve
      isDebug && debug(`[fallthrough] ${chalk.dim(id)}`)
    }
  }
}

export function tryFsResolve(fsPath: string) {
  const [file, query = ''] = fsPath.split(`?`)
  if (fs.existsSync(file)) {
    return file + query
  }
  for (const ext of supportedExts) {
    if (fs.existsSync(file + ext)) {
      return file + ext + query
    }
  }
}
