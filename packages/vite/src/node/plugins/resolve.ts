import fs from 'fs'
import path from 'path'
import { Plugin, ResolvedConfig } from '..'

export const FILE_PREFIX = `/@fs/`

export const supportedExts = ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']

export function resolvePlugin({ root }: ResolvedConfig): Plugin {
  return {
    name: 'vite:resolve',
    resolveId(id, importer) {
      // since this is the first plugin, the id always come from user source
      // code. If it starts with /, then it's a url.
      if (id.startsWith('/')) {
        // check for special paths. Since the browser doesn't allow bare imports,
        // we transform them into special prefixed paths.
        if (id.startsWith(FILE_PREFIX)) {
          // explicit fs paths that starts with /@fs/*
          return tryFsResolve(id.slice(FILE_PREFIX.length - 1))
        } else {
          // url -> file
          return tryFsResolve(path.resolve(root, id.slice(1)))
        }
      }

      if (id.startsWith('.') && importer && path.isAbsolute(importer)) {
        const fsPath = path.resolve(path.dirname(importer), id)
        return tryFsResolve(fsPath)
      }

      return null
    }
  }
}

function tryFsResolve(fsPath: string) {
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
