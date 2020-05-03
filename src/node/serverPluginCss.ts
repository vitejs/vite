import { Plugin } from './server'
import { isImportRequest } from './utils'
import { hmrClientId } from './serverPluginHmr'
import hash_sum from 'hash-sum'

export const cssPlugin: Plugin = ({ app, watcher, resolver }) => {
  app.use(async (ctx, next) => {
    await next()
    // handle .css imports
    // we rewrite it to JS that injects a <style> tag pointing to the same url
    // but with a `?raw` query which returns the actual css
    if (
      ctx.path.endsWith('.css') &&
      isImportRequest(ctx) &&
      // note ctx.body could be null if upstream set status to 304
      ctx.body &&
      // skip raw requests
      !ctx.query.raw
    ) {
      ctx.type = 'js'
      const id = JSON.stringify(hash_sum(ctx.path))
      const rawPath = JSON.stringify(ctx.path + '?raw')
      ctx.body = `
import { updateStyle } from "${hmrClientId}"\n
updateStyle(${id}, ${rawPath})
`.trim()
    }
  })

  // handle hmr
  watcher.on('change', (file) => {
    if (file.endsWith('.css')) {
      const publicPath = resolver.fileToRequest(file)
      const id = hash_sum(publicPath)
      watcher.send({
        type: 'style-update',
        id,
        path: publicPath,
        timestamp: Date.now()
      })
    }
  })
}
