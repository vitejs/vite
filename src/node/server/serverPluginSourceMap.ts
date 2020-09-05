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

function genSourceMapString(map: SourceMap) {
  // Ensure devtools can fetch the mapped sources.
  const sources = map.sources.map((path) => 'file://' + path)

  return `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(
    JSON.stringify({ ...map, sources })
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
