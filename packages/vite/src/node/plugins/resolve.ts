import path from 'path'
import { Plugin, ResolvedConfig } from '..'

export const MODULE_PREFIX = `/@modules/`
export const FILE_PREFIX = `/@file/`

export function resolvePlugin({ root }: ResolvedConfig): Plugin {
  return {
    name: 'vite:resolve',
    resolveId(id, importer) {
      // since this is the first plugin, the id always come from user source
      // code. If it starts with /, then it's a url.
      if (id.startsWith('/')) {
        // check for special paths. Since the browser doesn't allow bare imports,
        // we transform them into special prefixed paths.
        if (id.startsWith(MODULE_PREFIX)) {
          // unwrap bare module requests
          // /@modules/vue -> vue
          id = id.slice(MODULE_PREFIX.length)
        } else if (id.startsWith(FILE_PREFIX)) {
          id = id.slice(FILE_PREFIX.length - 1)
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
