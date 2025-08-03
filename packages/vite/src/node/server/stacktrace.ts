import path from 'node:path'
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import type { EnvironmentModuleGraph } from './server'

let offset: number

function calculateOffsetOnce() {
  if (offset !== undefined) {
    return
  }

  try {
    new Function('throw new Error(1)')()
  } catch (e) {
    // in Node 12, stack traces account for the function wrapper.
    // in Node 13 and later, the function wrapper adds two lines,
    // which must be subtracted to generate a valid mapping
    const match = /:(\d+):\d+\)$/.exec(e.stack.split('\n')[1])
    offset = match ? +match[1] - 1 : 0
  }
}


export function browserRewriteStacktrace(
  stack: string,
  moduleGraph: EnvironmentModuleGraph,
): [string, string] {
  let firstSource
  const processedStack = stack
    .split('\n')
    .map((line) => {
      return line.replace(
        /^ {4}at (?:(\S.*?)\s\()?(.*?)\)$/,
        (input, varName, url) => {
          const { pathname } = new URL(url)
          const [,id, line, column] = pathname.match(/^(.*?):(\d+):(\d+)$/)
          if (!id) return input

          const mod = moduleGraph.urlToModuleMap.get(id)
      	  const rawSource = mod?._clientModule.transformResult.code
      	  if (!firstSource) {
      	  	firstSource = rawSource
      	  }
      	  const rawSourceMap = mod?._clientModule.transformResult?.map
          const trimmedVarName = varName?.trim()

          if (!rawSourceMap) {
	        if (!trimmedVarName || trimmedVarName === 'eval') {
	          return `    at (${pathname})`
	        } else {
	          return `    at ${trimmedVarName} (${pathname})`
	        }
          }

          const traced = new TraceMap(rawSourceMap as any)

          const pos = originalPositionFor(traced, {
            line: Number(line) - offset,
            // stacktrace's column is 1-indexed, but sourcemap's one is 0-indexed
            column: Number(column) - 1,
          })

          if (!pos.source) {
            return input
          }

          const sourceFile = path.resolve(path.dirname(id), pos.source)
          // stacktrace's column is 1-indexed, but sourcemap's one is 0-indexed
          const source = `${sourceFile}:${pos.line}:${pos.column + 1}`
          if (!trimmedVarName || trimmedVarName === 'eval') {
            return `    at ${source}`
          } else {
            return `    at ${trimmedVarName} (${source})`
          }
        },
      )
    })
    .join('\n')
  return [firstSource, processedStack]
}
