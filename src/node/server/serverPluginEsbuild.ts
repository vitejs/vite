import { Plugin } from '.'
import { tjsxRE, transform } from '../esbuildService'
import { readBody, genSourceMapString } from '../utils'

export const esbuildPlugin: Plugin = ({ app, watcher, jsxConfig }) => {
  app.use(async (ctx, next) => {
    await next()
    if (ctx.body && tjsxRE.test(ctx.path)) {
      ctx.type = 'js'
      const src = await readBody(ctx.body)
      const { code, map } = await transform(src!, ctx.path, jsxConfig)
      let res = code
      if (map) {
        res += genSourceMapString(map)
      }
      ctx.body = res
    }
  })

  watcher.on('change', (file) => {
    if (tjsxRE.test(file)) {
      watcher.handleJSReload(file)
    }
  })
}
