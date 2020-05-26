import { ServerPlugin } from '.'
import { isImportRequest, isStaticAsset } from '../utils'

const usedAssetsSet = new Set<string>()

export const assetPathPlugin: ServerPlugin = ({ app, resolver, watcher }) => {
  app.use(async (ctx, next) => {
    if (isStaticAsset(ctx.path)) {
      if (isImportRequest(ctx)) {
        ctx.type = 'js'
        ctx.body = `export default ${JSON.stringify(ctx.path)}`
        return
      }
      usedAssetsSet.add(ctx.path)
    }
    return next()
  })

  watcher.on('change', (filePath) => {
    if (isStaticAsset(filePath)) {
      const publicPath = resolver.fileToRequest(filePath)

      // skip unused
      if (!usedAssetsSet.has(publicPath)) return

      watcher.handleJSReload(filePath)
    }
  })
}
