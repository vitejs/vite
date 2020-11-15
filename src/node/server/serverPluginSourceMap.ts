import { ServerPlugin } from '.'
import merge from 'merge-source-map'
import { ExistingRawSourceMap } from 'rollup'
import { RawSourceMap } from 'source-map'

export type SourceMap = ExistingRawSourceMap | RawSourceMap

export function mergeSourceMap(
  oldMap: SourceMap | null | undefined,
  newMap: SourceMap
): SourceMap {
  if (!oldMap) {
    return newMap
  }
  // merge-source-map will overwrite original sources if newMap also has
  // sourcesContent
  newMap.sourcesContent = []
  return merge(oldMap, newMap) as SourceMap
}

function getSourceMapString(map: SourceMap | string | undefined) {
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
      ctx.body += getSourceMapString(ctx.map)
    }
  })
}
