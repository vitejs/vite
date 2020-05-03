import { Plugin } from './server'
import { readBody } from './utils'

export const jsonPlugin: Plugin = ({ app }) => {
  app.use(async (ctx, next) => {
    await next()
    // handle .json imports
    if (ctx.path.endsWith('.json')) {
      const referer = ctx.get('referer')
      // only rewrite json if referer is not a page (fetch/ajax requests)
      if (/\.\w+$/.test(referer) && !referer.endsWith('.html')) {
        ctx.type = 'js'
        ctx.body = `export default ${await readBody(ctx.body)}`
      }
    }
  })
}
