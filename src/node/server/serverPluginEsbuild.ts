import { ServerPlugin } from '.'
import {
  tjsxRE,
  transform,
  resolveJsxOptions,
  vueJsxPublicPath,
  vueJsxFilePath
} from '../esbuildService'
import { readBody, cachedRead } from '../utils'

export const esbuildPlugin: ServerPlugin = ({ app, config }) => {
  const jsxConfig = resolveJsxOptions(config.jsx)

  app.use(async (ctx, next) => {
    // intercept and return vue jsx helper import
    if (ctx.path === vueJsxPublicPath) {
      await cachedRead(ctx, vueJsxFilePath)
    }

    await next()

    if (ctx.body && tjsxRE.test(ctx.path)) {
      ctx.type = 'js'
      const src = await readBody(ctx.body)
      const { code, map } = await transform(
        src!,
        ctx.url,
        jsxConfig,
        config.jsx
      )
      ctx.body = code
      if (map) {
        ctx.map = JSON.parse(map)
      }
    }
  })
}
