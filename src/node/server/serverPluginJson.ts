import { ServerPlugin } from '.'
import { readBody, isImportRequest } from '../utils'

const usedJsonSet = new Set<string>()

export const jsonPlugin: ServerPlugin = ({ app, resolver, watcher }) => {
  app.use(async (ctx, next) => {
    await next()
    // handle .json imports
    // note ctx.body could be null if upstream set status to 304
    if (ctx.path.endsWith('.json')) {
      if (isImportRequest(ctx) && ctx.body) {
        ctx.type = 'js'
        ctx.body = `export default ${await readBody(ctx.body)}`
      }
      usedJsonSet.add(ctx.path)
    }
  })

  watcher.on('change', (filePath) => {
    if (filePath.endsWith('.json')) {
      const publicPath = resolver.fileToRequest(filePath)

      // skip unused
      if (!usedJsonSet.has(publicPath)) return

      watcher.handleJSReload(filePath)
    }
  })
}
