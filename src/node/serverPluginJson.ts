import { Plugin } from './server'
import { readBody, isImportRequest } from './utils'

export const jsonPlugin: Plugin = ({ app }) => {
  app.use(async (ctx, next) => {
    await next()
    // handle .json imports
    // note ctx.body could be null if upstream set status to 304
    if (ctx.path.endsWith('.json') && isImportRequest(ctx) && ctx.body) {
      ctx.type = 'js'
      ctx.body = `export default ${await readBody(ctx.body)}`
    }
  })
}
