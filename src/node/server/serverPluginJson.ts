import { Plugin } from '.'
import { readBody, isImportRequest } from '../utils'

export const jsonPlugin: Plugin = ({ app, watcher }) => {
  app.use(async (ctx, next) => {
    await next()
    // handle .json imports
    // note ctx.body could be null if upstream set status to 304
    if (ctx.path.endsWith('.json') && isImportRequest(ctx) && ctx.body) {
      ctx.type = 'js'
      ctx.body = `export default ${await readBody(ctx.body)}`
    }
  })

  watcher.on('change', (file) => {
    if (file.endsWith('.json')) {
      watcher.handleJSReload(file)
    }
  })
}
