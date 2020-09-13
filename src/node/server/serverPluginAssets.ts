import { ServerPlugin } from '.'
import { isImportRequest, isStaticAsset } from '../utils'

interface AssetPathPluginOptions {
  include?: (file: string) => boolean
}

export const createAssetPathPlugin = ({
  include = isStaticAsset
}: AssetPathPluginOptions = {}): ServerPlugin => {
  return ({ app }) => {
    app.use(async (ctx, next) => {
      if (include(ctx.path) && isImportRequest(ctx)) {
        ctx.type = 'js'
        ctx.body = `export default ${JSON.stringify(ctx.path)}`
        return
      }
      return next()
    })
  }
}
