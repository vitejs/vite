import { ServerPlugin } from '.'
import { isImportRequest } from '../utils'

export const assetPathPlugin: ServerPlugin = ({ app }) => {
  app.use(async (ctx, next) => {
    if (ctx.resolver.isAssetRequest(ctx.path) && isImportRequest(ctx)) {
      ctx.type = 'js'
      ctx.body = `export default ${JSON.stringify(ctx.path)}`
      return
    }
    return next()
  })
}
