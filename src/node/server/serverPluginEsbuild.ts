import LRUCache from 'lru-cache'
import { Context, ServerPlugin } from '.'
import {
  tjsxRE,
  transform,
  resolveJsxOptions,
  vueJsxPublicPath,
  vueJsxFilePath
} from '../esbuildService'
import { readBody, cleanUrl } from '../utils'

interface CacheEntry {
  lastModified: Date
  code: string
  map: Context['map']
}

export const esbuildPlugin: ServerPlugin = ({ app, config, resolver }) => {
  const jsxConfig = resolveJsxOptions(config.jsx)

  const transformCache = new LRUCache<string, CacheEntry>({
    max: 10000
  })

  app.use(async (ctx, next) => {
    // intercept and return vue jsx helper import
    if (ctx.path === vueJsxPublicPath) {
      await ctx.read(vueJsxFilePath)
    }

    await next()

    if (
      !tjsxRE.test(ctx.path) ||
      !ctx.body ||
      ctx.type === 'text/html' ||
      resolver.isPublicRequest(ctx.path)
    ) {
      return
    }

    let cached = transformCache.get(ctx.path)
    if (!cached || cached.lastModified < ctx.lastModified) {
      const src = await readBody(ctx.body)
      const { code, map } = await transform(
        src!,
        resolver.requestToFile(cleanUrl(ctx.url)),
        jsxConfig,
        config.jsx
      )
      transformCache.set(
        ctx.path,
        (cached = {
          lastModified: ctx.lastModified,
          code,
          map: map && JSON.parse(map)
        })
      )
    }

    ctx.type = 'js'
    ctx.body = cached.code
    ctx.map = cached.map
  })
}
