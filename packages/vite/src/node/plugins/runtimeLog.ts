import path from 'node:path'
import fs from 'node:fs'
import { parseErrorStacktrace } from '@vitest/utils/source-map'
import c from 'picocolors'
import type { DevEnvironment, Plugin } from '..'
import { normalizePath } from '..'
import { generateCodeFrame } from '../utils'

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
          environment.config.logger.error(output, {
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
  const errorName = error.name || 'Unknown Error'
  output += c.red(`[Unhandled error] ${c.bold(errorName)}: ${error.message}\n`)
  for (const stack of stacks) {
    const file = path.relative(environment.config.root, stack.file)
    output += ` > ${[stack.method, `${file}:${stack.line}:${stack.column}`]
      .filter(Boolean)
      .join(' ')}\n`
    if (stack === nearest) {
      const code = fs.readFileSync(stack.file, 'utf-8')
      // TODO: highlight?
      output += generateCodeFrame(code, stack)
      output += '\n'
    }
  }
  return output
}
