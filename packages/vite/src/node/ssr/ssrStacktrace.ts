import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import type { ModuleGraph } from '../server/moduleGraph'

let offset: number
try {
  new Function('throw new Error(1)')()
} catch (e) {
  // in Node 12, stack traces account for the function wrapper.
  // in Node 13 and later, the function wrapper adds two lines,
  // which must be subtracted to generate a valid mapping
  const match = /:(\d+):\d+\)$/.exec(e.stack.split('\n')[1])
  offset = match ? +match[1] - 1 : 0
}

export function ssrRewriteStacktrace(
  stack: string,
  moduleGraph: ModuleGraph,
): string {
  return stack
    .split('\n')
    .map((line) => {
      return line.replace(
        /^ {4}at (?:(\S.*?)\s\()?(.+?):(\d+)(?::(\d+))?\)?/,
        (input, varName, url, line, column) => {
          if (!url) return input

          const mod = moduleGraph.urlToModuleMap.get(url)
          const rawSourceMap = mod?.ssrTransformResult?.map

          if (!rawSourceMap) {
            return input
          }

          const traced = new TraceMap(rawSourceMap as any)

          const pos = originalPositionFor(traced, {
            line: Number(line) - offset,
            column: Number(column),
          })

          if (!pos.source || pos.line == null || pos.column == null) {
            return input
          }

          const trimedVarName = varName.trim()
          const source = `${pos.source}:${pos.line}:${pos.column}`
          if (!trimedVarName || trimedVarName === 'eval') {
            return `    at ${source}`
          } else {
            return `    at ${trimedVarName} (${source})`
          }
        },
      )
    })
    .join('\n')
}

export function rebindErrorStacktrace(e: Error, stacktrace: string): void {
  const { configurable, writable } = Object.getOwnPropertyDescriptor(
    e,
    'stack',
  )!
  if (configurable) {
    Object.defineProperty(e, 'stack', {
      value: stacktrace,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  } else if (writable) {
    e.stack = stacktrace
  }
}

const rewroteStacktraces = new WeakSet()

export function ssrFixStacktrace(e: Error, moduleGraph: ModuleGraph): void {
  if (!e.stack) return
  // stacktrace shouldn't be rewritten more than once
  if (rewroteStacktraces.has(e)) return

  const stacktrace = ssrRewriteStacktrace(e.stack, moduleGraph)
  rebindErrorStacktrace(e, stacktrace)

  rewroteStacktraces.add(e)
}
