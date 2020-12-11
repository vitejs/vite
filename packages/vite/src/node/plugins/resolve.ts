import path from 'path'
import { Plugin, ResolvedConfig } from '..'

export const FILE_PREFIX = `/@fs/`

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
          id = id.slice(FILE_PREFIX.length - 1)
          if (id.startsWith('//')) id = id.slice(1)
        } else {
          // url -> file
          id = path.resolve(root, id.slice(1))
        }
        return this.resolve(id, importer, { skipSelf: true })
      }
      return null
    }
  }
}
