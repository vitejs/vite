import path from 'node:path'
import fs from 'node:fs'
import { stripVTControlCharacters } from 'node:util'
import { parseErrorStacktrace } from '@vitest/utils/source-map'
import type { DevEnvironment, Plugin } from '..'
import { normalizePath } from '..'

export function runtimeLogPlugin(pluginOpts?: {
  /** @default ["client"] */
  environments?: string[]
}): Plugin {
  const environmentNames = pluginOpts?.environments || ['client']

  return {
    name: 'vite:runtime-log',
    apply: 'serve',
    configureServer(server) {
      for (const name of environmentNames) {
        const environment = server.environments[name]
        environment.hot.on('vite:runtime-log', (payload: RuntimeLogPayload) => {
          const output = formatError(payload.error, environment)
          environment.config.logger.error('[RUNTIME] ' + output, {
            timestamp: true,
          })
        })
      }
    },
  }
}

type RuntimeLogPayload = {
  error: {
    name: string
    message: string
    stack?: string
  }
}

function formatError(error: any, environment: DevEnvironment) {
  // https://github.com/vitest-dev/vitest/blob/4783137cd8d766cf998bdf2d638890eaa51e08d9/packages/browser/src/node/projectParent.ts#L58
  const stacks = parseErrorStacktrace(error, {
    getUrlId(id) {
      const moduleGraph = environment.moduleGraph
      const mod = moduleGraph.getModuleById(id)
      if (mod) {
        return id
      }
      const resolvedPath = normalizePath(
        path.resolve(environment.config.root, id.slice(1)),
      )
      const modUrl = moduleGraph.getModuleById(resolvedPath)
      if (modUrl) {
        return resolvedPath
      }
      // some browsers (looking at you, safari) don't report queries in stack traces
      // the next best thing is to try the first id that this file resolves to
      const files = moduleGraph.getModulesByFile(resolvedPath)
      if (files && files.size) {
        return files.values().next().value!.id!
      }
      return id
    },
    getSourceMap(id) {
      // stack is already rewritten on server
      if (environment.name === 'client') {
        return environment.moduleGraph.getModuleById(id)?.transformResult?.map
      }
    },
  })

  // https://github.com/vitest-dev/vitest/blob/4783137cd8d766cf998bdf2d638890eaa51e08d9/packages/vitest/src/node/printError.ts#L64
  const nearest = stacks.find((stack) => {
    const modules = environment.moduleGraph.getModulesByFile(stack.file)
    return (
      [...(modules || [])].some((m) => m.transformResult) &&
      fs.existsSync(stack.file)
    )
  })

  let output = ''
  output += `${error.name}: ${error.message}\n`
  for (const stack of stacks) {
    const file = path.relative(environment.config.root, stack.file)
    output += ` > ${[stack.method, `${file}:${stack.line}:${stack.column}`]
      .filter(Boolean)
      .join(' ')}\n`
    if (stack === nearest) {
      const code = fs.readFileSync(stack.file, 'utf-8')
      output += generateCodeFrame(code, 4, stack)
      output += '\n'
    }
  }
  return output
}

const c = {
  gray: (s: string) => s,
  red: (s: string) => s,
}

function generateCodeFrame(
  source: string,
  indent = 0,
  loc: { line: number; column: number } | number,
  range = 2,
): string {
  const start =
    typeof loc === 'object'
      ? positionToOffset(source, loc.line, loc.column)
      : loc
  const end = start
  const lines = source.split(lineSplitRE)
  const nl = /\r\n/.test(source) ? 2 : 1
  let count = 0
  let res: string[] = []

  const columns = process.stdout?.columns || 80

  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + nl
    if (count >= start) {
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) {
          continue
        }

        const lineLength = lines[j].length
        const strippedContent = stripVTControlCharacters(lines[j])

        if (strippedContent.startsWith('//# sourceMappingURL')) {
          continue
        }

        // too long, maybe it's a minified file, skip for codeframe
        if (strippedContent.length > 200) {
          return ''
        }

        res.push(
          lineNo(j + 1) +
            truncateString(lines[j].replace(/\t/g, ' '), columns - 5 - indent),
        )

        if (j === i) {
          // push underline
          const pad = start - (count - lineLength) + (nl - 1)
          const length = Math.max(
            1,
            end > count ? lineLength - pad : end - start,
          )
          res.push(lineNo() + ' '.repeat(pad) + c.red('^'.repeat(length)))
        } else if (j > i) {
          if (end > count) {
            const length = Math.max(1, Math.min(end - count, lineLength))
            res.push(lineNo() + c.red('^'.repeat(length)))
          }
          count += lineLength + 1
        }
      }
      break
    }
  }

  if (indent) {
    res = res.map((line) => ' '.repeat(indent) + line)
  }

  return res.join('\n')
}

function lineNo(no: number | string = '') {
  return c.gray(`${String(no).padStart(3, ' ')}| `)
}

const lineSplitRE: RegExp = /\r?\n/

function positionToOffset(
  source: string,
  lineNumber: number,
  columnNumber: number,
): number {
  const lines = source.split(lineSplitRE)
  const nl = /\r\n/.test(source) ? 2 : 1
  let start = 0

  if (lineNumber > lines.length) {
    return source.length
  }

  for (let i = 0; i < lineNumber - 1; i++) {
    start += lines[i].length + nl
  }

  return start + columnNumber
}

function truncateString(text: string, maxLength: number): string {
  const plainText = stripVTControlCharacters(text)

  if (plainText.length <= maxLength) {
    return text
  }

  return `${plainText.slice(0, maxLength - 1)}…`
}
