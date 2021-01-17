import { SourceMapConsumer, RawSourceMap } from 'source-map'
import { ModuleGraph } from './moduleGraph'

export function ssrRewriteStacktrace(stack: string, moduleGraph: ModuleGraph) {
  return stack
    .split('\n')
    .map((line) => {
      return line.replace(
        /^ {4}at (?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?)\)?/,
        (input, varName, url, line, column) => {
          if (!url) return input

          const mod = moduleGraph.urlToModuleMap.get(url)
          const rawSourceMap = mod?.ssrTransformResult?.map

          if (!rawSourceMap) {
            return input
          }

          const consumer = new SourceMapConsumer(
            (rawSourceMap as any) as RawSourceMap
          )

          const pos = consumer.originalPositionFor({
            // source map lines generated via new Function() in Node.js is always
            // incremented by 2 - no idea why
            line: Number(line) - 2,
            column: Number(column),
            bias: SourceMapConsumer.LEAST_UPPER_BOUND
          })

          if (!pos.source) {
            return input
          }

          const source = `${pos.source}:${pos.line || 0}:${pos.column || 0}`
          if (!varName || varName === 'eval') {
            return `    at ${source}`
          } else {
            return `    at ${varName} (${source})`
          }
        }
      )
    })
    .join('\n')
}
