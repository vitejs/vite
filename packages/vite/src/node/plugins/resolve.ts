import fs from 'fs'
import path from 'path'
import { Plugin, ResolvedConfig } from '..'

export const FILE_PREFIX = `/@fs/`

export const supportedExts = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']

export function resolvePlugin({ root }: ResolvedConfig): Plugin {
  return {
    name: 'vite:resolve',
    resolveId(id, importer) {
      if (id.startsWith(FILE_PREFIX)) {
        // explicit fs paths that starts with /@fs/*
        let fsPath = id.slice(FILE_PREFIX.length - 1)
        if (fsPath.startsWith('//')) fsPath = fsPath.slice(1)
        return tryFsResolve(fsPath)
      }

      let res
      // 1. try resolving as raw url
      // /foo -> /fs-root/foo
      if (id.startsWith('/')) {
        const fsPath = path.resolve(root, id.slice(1))
        if ((res = tryFsResolve(fsPath))) {
          return res
        }
      }

      // relative
      if (id.startsWith('.') && importer && path.isAbsolute(importer)) {
        const fsPath = path.resolve(path.dirname(importer), id)
        return tryFsResolve(fsPath)
      }

      // absolute fs paths
      if (path.isAbsolute(id) && (res = tryFsResolve(id))) {
        return res
      }

      // if we didn't manage to resolve it here, it will go on to be resolved by
      // plugin/node-resolve
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
