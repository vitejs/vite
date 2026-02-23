import path from 'node:path'
import fs from 'node:fs'
import { parseErrorStacktrace } from '@vitest/utils/source-map'
import c from 'picocolors'
import type { ForwardConsolePayload } from '#types/customEvent'
import type { DevEnvironment, Plugin } from '..'
import { normalizePath } from '..'
import { generateCodeFrame } from '../utils'

export function forwardConsolePlugin(pluginOpts: {
  environments: string[]
}): Plugin {
  return {
    name: 'vite:forward-console',
    apply: 'serve',
    configureServer(server) {
      for (const name of pluginOpts.environments) {
        const environment = server.environments[name]
        environment.hot.on('vite:forward-console', (payload) => {
          if (
            payload.type === 'error' ||
            payload.type === 'unhandled-rejection'
          ) {
            const output = formatError(payload, environment)
            environment.config.logger.error(output, {
              timestamp: true,
            })
          } else {
            const output =
              c.dim(`[Console ${payload.data.level}] `) + payload.data.message
            if (payload.data.level === 'error') {
              environment.config.logger.error(output, {
                timestamp: true,
              })
            } else if (payload.data.level === 'warn') {
              environment.config.logger.warn(output, {
                timestamp: true,
              })
            } else {
              environment.config.logger.info(output, {
                timestamp: true,
              })
            }
          }
        })
      }
    },
  }
}

function formatError(
  payload: Extract<
    ForwardConsolePayload,
    { type: 'error' | 'unhandled-rejection' }
  >,
  environment: DevEnvironment,
) {
  const error = payload.data
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
    // Vitest uses this option to skip internal files
    // https://github.com/vitejs/vitest/blob/4783137cd8d766cf998bdf2d638890eaa51e08d9/packages/utils/src/source-map.ts#L17
    ignoreStackEntries: [],
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
  const title =
    payload.type === 'unhandled-rejection'
      ? '[Unhandled rejection]'
      : '[Unhandled error]'
  output += c.red(`${title} ${c.bold(error.name)}: ${error.message}\n`)
  for (const stack of stacks) {
    const file = normalizePath(
      path.relative(environment.config.root, stack.file),
    )
    output += ` > ${[stack.method, `${file}:${stack.line}:${stack.column}`]
      .filter(Boolean)
      .join(' ')}\n`
    if (stack === nearest) {
      const code = fs.readFileSync(stack.file, 'utf-8')
      // TODO: highlight?
      output += generateCodeFrame(code, stack).replace(/^/gm, '    ')
      output += '\n'
    }
  }
  return output
}
