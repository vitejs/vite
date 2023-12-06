import path from 'node:path'
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import type { ModuleGraph } from '../server/moduleGraph'

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

export function ssrRewriteStacktrace(
  stack: string,
  moduleGraph: ModuleGraph,
): string {
  calculateOffsetOnce()
  return stack
    .split('\n')
    .map((line) => {
      return line.replace(
        /^ {4}at (?:(\S.*?)\s\()?(.+?):(\d+)(?::(\d+))?\)?/,
        (input, varName, id, line, column) => {
          if (!id) return input

          const mod = moduleGraph.idToModuleMap.get(id)
          const rawSourceMap = mod?.ssrTransformResult?.map

          if (!rawSourceMap) {
            return input
          }

          const traced = new TraceMap(rawSourceMap as any)

          const pos = originalPositionFor(traced, {
            line: Number(line) - offset,
            // stacktrace's column is 1-indexed, but sourcemap's one is 0-indexed
            column: Number(column) - 1,
          })

          if (!pos.source || pos.line == null || pos.column == null) {
            return input
          }

          const trimmedVarName = varName.trim()
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
