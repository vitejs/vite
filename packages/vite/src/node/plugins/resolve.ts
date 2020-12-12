import fs from 'fs'
import path from 'path'
import { createDebugger } from '../utils'
import { Plugin, ResolvedConfig } from '..'
import chalk from 'chalk'
import { FILE_PREFIX } from '../config'

export const supportedExts = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']

const isDebug = process.env.DEBUG
const debug = createDebugger('vite:resolve-details', {
  onlyWhenFocused: true
})

export function resolvePlugin({ root }: ResolvedConfig): Plugin {
  return {
    name: 'vite:resolve',
    resolveId(id, importer) {
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
        return res || fsPath
      }

      // URL
      // /foo -> /fs-root/foo
      if (id.startsWith('/')) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[url] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return res
        }
      }

      // relative
      if (id.startsWith('.') && importer && path.isAbsolute(importer)) {
        const fsPath = path.resolve(path.dirname(importer), id)
        if ((res = tryFsResolve(fsPath))) {
          isDebug && debug(`[relative] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
          return res
        }
      }

      // absolute fs paths
      if (path.isAbsolute(id) && (res = tryFsResolve(id))) {
        isDebug && debug(`[fs] ${chalk.cyan(id)} -> ${chalk.dim(res)}`)
        return res
      }

      // If we didn't manage to resolve it here, it will go on to be resolved by
      // plugin/node-resolve which is quite slow, so we want to make sure only
      // actual node dependencies reach here.
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
