import { codeFrameColumns, SourceLocation } from '@babel/code-frame'
import { SourceMapConsumer, RawSourceMap } from 'source-map'
import { ModuleGraph } from '../server/moduleGraph'
import fs from 'fs'

const stackFrameRE = /^ {4}at (?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?)\)?/

export function ssrRewriteStacktrace(
  error: Error,
  moduleGraph: ModuleGraph
): string {
  let code!: string
  let location: SourceLocation | undefined

  const stackFrames = error
    .stack!.split('\n')
    .slice(error.message.split('\n').length)
    .map((line, i) => {
      return line.replace(stackFrameRE, (input, varName, url, line, column) => {
        if (!url) return input

        const mod = moduleGraph.urlToModuleMap.get(url)
        const rawSourceMap = mod?.ssrTransformResult?.map

        if (!rawSourceMap) {
          return input
        }

        const consumer = new SourceMapConsumer(
          rawSourceMap as any as RawSourceMap
        )

        const pos = consumer.originalPositionFor({
          line: Number(line),
          column: Number(column),
          bias: SourceMapConsumer.GREATEST_LOWER_BOUND
        })

        if (!pos.source) {
          return input
        }

        if (i == 0) {
          code = fs.readFileSync(pos.source, 'utf8')
          location = {
            start: { line: pos.line, column: pos.column }
          }
        }

        const source = `${pos.source}:${pos.line}:${pos.column}`
        if (!varName || varName === 'eval') {
          return `    at ${source}`
        } else {
          return `    at ${varName} (${source})`
        }
      })
    })

  const message = location
    ? codeFrameColumns(code, location, {
        highlightCode: true,
        message: error.message
      })
    : error.message

  return message + '\n\n' + stackFrames.join('\n')
}
