import { ServerPlugin } from '.'
import { RawSourceMap } from 'source-map'

function genSourceMapString(map: RawSourceMap | string | undefined) {
  if (typeof map !== 'string') {
    map = JSON.stringify(map)
  }
  return `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(
    map
  ).toString('base64')}`
}

export const sourceMapPlugin: ServerPlugin = ({ app }) => {
  app.use(async (ctx, next) => {
    await next()
    if (typeof ctx.body === 'string' && ctx.map) {
      ctx.body += genSourceMapString(ctx.map)
    }
  })
}
