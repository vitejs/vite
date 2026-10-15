import fs from 'node:fs'
import path from 'node:path'
import { parseErrorStacktrace } from '@vitest/utils/source-map'
import convertSourceMap from 'convert-source-map'
import c from 'picocolors'
import type { ForwardConsolePayload } from '#types/customEvent'
import type { DevEnvironment, Plugin } from '..'
import { normalizePath } from '..'
import { cleanUrl } from '../../shared/utils'
import type { MemoryFiles } from '../server/bundledDev'
import { extractSourcemapFromFile } from '../server/sourcemap'
import { generateCodeFrame } from '../utils'

export function forwardConsolePlugin(pluginOpts: {
  environments: string[]
}): Plugin {
  const sourceMapCache = new Map<string, any>()

  return {
    name: 'vite:forward-console',
    apply: 'serve',
    configureServer(server) {
      for (const name of pluginOpts.environments) {
        const environment = server.environments[name]
        const bundledDevOutDir = getBundledDevOutDir(environment)
        environment.hot.on('vite:forward-console', (payload) => {
          if (
            payload.type === 'error' ||
            payload.type === 'unhandled-rejection'
          ) {
            const output = formatError(
              payload,
              environment,
              sourceMapCache,
              bundledDevOutDir,
            )
            environment.config.logger.error(output, {
              timestamp: true,
            })
          } else {
            const output =
              c.dim(`[console.${payload.data.level}] `) + payload.data.message
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
  sourceMapCache: Map<string, any>,
  bundledDevOutDir: string,
) {
  const error = payload.data
  const memoryFiles = environment.bundledDev?.memoryFiles
  const stacks = parseErrorStacktrace(error, {
    getUrlId(id) {
      if (memoryFiles) {
        return (
          getBundledDevChunkPath(
            environment,
            memoryFiles,
            bundledDevOutDir,
            id,
          ) ?? id
        )
      }
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
      if (memoryFiles) {
        return getBundledDevSourceMap(memoryFiles, bundledDevOutDir, id)
      }
      if (sourceMapCache.has(id)) {
        return sourceMapCache.get(id)
      }

      const result = environment.moduleGraph.getModuleById(id)?.transformResult
      // handle non-inline source map such as pre-bundled deps in node_modules/.vite
      if (result && !result.map) {
        try {
          const filePath = id.split('?')[0]
          const extracted = extractSourcemapFromFile(
            result.code,
            filePath,
            environment.config.logger,
          )
          sourceMapCache.set(id, extracted?.map)
          return extracted?.map
        } catch {
          sourceMapCache.set(id, null)
          return null
        }
      }

      sourceMapCache.set(id, result?.map)
      return result?.map
    },
    // override it to empty since vitest uses this option to skip internal files by default.
    // https://github.com/vitest-dev/vitest/blob/4783137cd8d766cf998bdf2d638890eaa51e08d9/packages/utils/src/source-map.ts#L17
    ignoreStackEntries: [],
  })

  const nearest = stacks.find((stack) => {
    if (memoryFiles) {
      return (
        !environment.config.dev.sourcemapIgnoreList(
          stack.file,
          `${stack.file}.map`,
        ) && fs.existsSync(stack.file)
      )
    }
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
      output += generateCodeFrame(code, stack).replace(/^/gm, '    ')
      output += '\n'
    }
  }
  return output
}

// Under bundled dev, the client module graph is empty and the browser runs
// bundle chunks served from `memoryFiles`. Their source maps list the sources
// relative to the output dir, so chunk URLs are turned into paths inside it.
function getBundledDevOutDir(environment: DevEnvironment): string {
  return normalizePath(
    path.resolve(environment.config.root, environment.config.build.outDir),
  )
}

function getBundledDevChunkPath(
  environment: DevEnvironment,
  memoryFiles: MemoryFiles,
  outDir: string,
  url: string,
): string | undefined {
  const { decodedBase } = environment.config
  url = cleanUrl(url)
  if (!url.startsWith(decodedBase)) return
  const fileName = url.slice(decodedBase.length)
  if (memoryFiles.has(fileName)) {
    return `${outDir}/${fileName}`
  }
}

function getBundledDevSourceMap(
  memoryFiles: MemoryFiles,
  outDir: string,
  chunkPath: string,
) {
  if (!chunkPath.startsWith(`${outDir}/`)) return null
  const chunkFileName = chunkPath.slice(outDir.length + 1)
  const readFile = (fileName: string) => {
    const source = memoryFiles.get(fileName)?.source
    return typeof source === 'string'
      ? source
      : source && Buffer.from(source).toString('utf-8')
  }
  const code = readFile(chunkFileName)
  if (code === undefined) return null
  try {
    const converter =
      convertSourceMap.fromSource(code) ||
      convertSourceMap.fromMapFileSource(code, (mapFileName: string) => {
        const mapFilePath = path.posix.join(
          path.posix.dirname(chunkFileName),
          mapFileName,
        )
        const map = readFile(mapFilePath)
        if (map === undefined) {
          throw new Error(`${mapFilePath} is not in memoryFiles`)
        }
        return map
      })
    return converter?.toObject() ?? null
  } catch {
    return null
  }
}
