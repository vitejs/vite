import path from 'node:path'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'
import colors from 'picocolors'
import type { Plugin } from '../plugin'
import { isDefined, isInNodeModules, normalizePath } from '../utils'
import { LogLevels } from '../logger'
import { withTrailingSlash } from '../../shared/utils'
import type { Environment } from '../environment'

const groups = [
  { name: 'Assets', color: colors.green },
  { name: 'CSS', color: colors.magenta },
  { name: 'JS', color: colors.cyan },
]
type LogEntry = {
  name: string
  group: (typeof groups)[number]['name']
  size: number
  compressedSize: number | null
  mapSize: number | null
}

const COMPRESSIBLE_ASSETS_RE = /\.(?:html|json|svg|txt|xml|xhtml)$/

function createPerEnvPlugin(factory: () => Plugin): Plugin {
  const defaultPlugin = factory()

  let init = false
  const pluginMap = new WeakMap<Environment, Plugin>()

  function getPlugin(env: Environment) {
    // reuse the default plugin for the first environment
    if (!init) {
      init = true
      pluginMap.set(env, defaultPlugin)
    }
    if (!pluginMap.has(env)) {
      pluginMap.set(env, factory())
    }
    return pluginMap.get(env)!
  }

  const plugin: any = {}

  for (const [key, value] of Object.entries(defaultPlugin)) {
    if (typeof value === 'function') {
      plugin[key] = function (...args: any[]) {
        if (!this.environment) {
          throw new Error(
            'Hook "' + key + '" is not supported in `createPerEnvPlugin`',
          )
        }
        const plugin = getPlugin(this.environment)
        return (plugin as any)[key].apply(this, args)
      }
    } else if (value && value.handler && typeof value.handler === 'function') {
      plugin[key] = {
        ...value,
        handler(...args: any[]) {
          if (!this.environment) {
            throw new Error(
              'Hook "' + key + '" is not supported in `createPerEnvPlugin`',
            )
          }
          const plugin = getPlugin(this.environment)
          return (plugin as any)[key].handler.apply(this, args)
        },
      }
    } else {
      plugin[key] = value
    }
  }

  return plugin
}

export function buildReporterPlugin(): Plugin {
  return createPerEnvPlugin(() => _buildReporterPlugin())
}

function _buildReporterPlugin(): Plugin {
  const compress = promisify(gzip)
  let chunkLimit = 500

  const numberFormatter = new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
  const displaySize = (bytes: number) => {
    return `${numberFormatter.format(bytes / 1000)} kB`
  }

  const tty = process.stdout.isTTY && !process.env.CI
  let shouldLogInfo = false
  let hasTransformed = false
  let hasRenderedChunk = false
  let hasCompressChunk = false
  let transformedCount = 0
  let chunkCount = 0
  let compressedCount = 0

  async function getCompressedSize(
    code: string | Uint8Array,
    env: Environment,
  ): Promise<number | null> {
    if (env.options.build.ssr || !env.options.build.reportCompressedSize) {
      return null
    }
    if (shouldLogInfo && !hasCompressChunk) {
      if (!tty) {
        env.logger.info('computing gzip size...')
      } else {
        writeLine('computing gzip size (0)...')
      }
      hasCompressChunk = true
    }
    const compressed = await compress(
      typeof code === 'string' ? code : Buffer.from(code),
    )
    compressedCount++
    if (shouldLogInfo && tty) {
      writeLine(`computing gzip size (${compressedCount})...`)
    }
    return compressed.length
  }

  const logTransform = throttle((id: string, root: string) => {
    writeLine(
      `transforming (${transformedCount}) ${colors.dim(
        path.relative(root, id),
      )}`,
    )
  })

  return {
    name: 'vite:reporter',

    sharedDuringBuild: true,

    transform(_, id) {
      transformedCount++
      if (shouldLogInfo) {
        if (!tty) {
          if (!hasTransformed) {
            this.environment!.logger.info(`transforming...`)
          }
        } else {
          if (id.includes(`?`)) return
          logTransform(id, this.environment!.config.root)
        }
        hasTransformed = true
      }
      return null
    },

    buildStart() {
      chunkLimit = this.environment!.options.build.chunkSizeWarningLimit
      shouldLogInfo =
        LogLevels[this.environment!.config.logLevel || 'info'] >= LogLevels.info
      transformedCount = 0
    },

    buildEnd() {
      if (shouldLogInfo) {
        if (tty) {
          clearLine()
        }
        this.environment!.logger.info(
          `${colors.green(`✓`)} ${transformedCount} modules transformed.`,
        )
      }
    },

    renderStart() {
      chunkCount = 0
      compressedCount = 0
    },

    renderChunk(code, chunk, options) {
      if (!options.inlineDynamicImports) {
        for (const id of chunk.moduleIds) {
          const module = this.getModuleInfo(id)
          if (!module) continue
          // When a dynamic importer shares a chunk with the imported module,
          // warn that the dynamic imported module will not be moved to another chunk (#12850).
          if (module.importers.length && module.dynamicImporters.length) {
            // Filter out the intersection of dynamic importers and sibling modules in
            // the same chunk. The intersecting dynamic importers' dynamic import is not
            // expected to work. Note we're only detecting the direct ineffective
            // dynamic import here.
            const detectedIneffectiveDynamicImport =
              module.dynamicImporters.some(
                (id) => !isInNodeModules(id) && chunk.moduleIds.includes(id),
              )
            if (detectedIneffectiveDynamicImport) {
              this.warn(
                `\n(!) ${
                  module.id
                } is dynamically imported by ${module.dynamicImporters.join(
                  ', ',
                )} but also statically imported by ${module.importers.join(
                  ', ',
                )}, dynamic import will not move module into another chunk.\n`,
              )
            }
          }
        }
      }

      chunkCount++
      if (shouldLogInfo) {
        if (!tty) {
          if (!hasRenderedChunk) {
            this.environment!.logger.info('rendering chunks...')
          }
        } else {
          writeLine(`rendering chunks (${chunkCount})...`)
        }
        hasRenderedChunk = true
      }
      return null
    },

    generateBundle() {
      if (shouldLogInfo && tty) clearLine()
    },

    async writeBundle({ dir: outDir }, output) {
      const env = this.environment!
      let hasLargeChunks = false

      if (shouldLogInfo) {
        const entries = (
          await Promise.all(
            Object.values(output).map(
              async (chunk): Promise<LogEntry | null> => {
                if (chunk.type === 'chunk') {
                  return {
                    name: chunk.fileName,
                    group: 'JS',
                    size: chunk.code.length,
                    compressedSize: await getCompressedSize(chunk.code, env),
                    mapSize: chunk.map ? chunk.map.toString().length : null,
                  }
                } else {
                  if (chunk.fileName.endsWith('.map')) return null
                  const isCSS = chunk.fileName.endsWith('.css')
                  const isCompressible =
                    isCSS || COMPRESSIBLE_ASSETS_RE.test(chunk.fileName)
                  return {
                    name: chunk.fileName,
                    group: isCSS ? 'CSS' : 'Assets',
                    size: chunk.source.length,
                    mapSize: null, // Rollup doesn't support CSS maps?
                    compressedSize: isCompressible
                      ? await getCompressedSize(chunk.source, env)
                      : null,
                  }
                }
              },
            ),
          )
        ).filter(isDefined)
        if (tty) clearLine()

        let longest = 0
        let biggestSize = 0
        let biggestMap = 0
        let biggestCompressSize = 0
        for (const entry of entries) {
          if (entry.name.length > longest) longest = entry.name.length
          if (entry.size > biggestSize) biggestSize = entry.size
          if (entry.mapSize && entry.mapSize > biggestMap) {
            biggestMap = entry.mapSize
          }
          if (
            entry.compressedSize &&
            entry.compressedSize > biggestCompressSize
          ) {
            biggestCompressSize = entry.compressedSize
          }
        }

        const sizePad = displaySize(biggestSize).length
        const mapPad = displaySize(biggestMap).length
        const compressPad = displaySize(biggestCompressSize).length

        const relativeOutDir = normalizePath(
          path.relative(
            env.config.root,
            path.resolve(env.config.root, outDir ?? env.options.build.outDir),
          ),
        )
        const assetsDir = path.join(env.options.build.assetsDir, '/')

        for (const group of groups) {
          const filtered = entries.filter((e) => e.group === group.name)
          if (!filtered.length) continue
          for (const entry of filtered.sort((a, z) => a.size - z.size)) {
            const isLarge =
              group.name === 'JS' && entry.size / 1000 > chunkLimit
            if (isLarge) hasLargeChunks = true
            const sizeColor = isLarge ? colors.yellow : colors.dim
            let log = colors.dim(withTrailingSlash(relativeOutDir))
            log +=
              !env.config.build.lib &&
              entry.name.startsWith(withTrailingSlash(assetsDir))
                ? colors.dim(assetsDir) +
                  group.color(
                    entry.name
                      .slice(assetsDir.length)
                      .padEnd(longest + 2 - assetsDir.length),
                  )
                : group.color(entry.name.padEnd(longest + 2))
            log += colors.bold(
              sizeColor(displaySize(entry.size).padStart(sizePad)),
            )
            if (entry.compressedSize) {
              log += colors.dim(
                ` │ gzip: ${displaySize(entry.compressedSize).padStart(
                  compressPad,
                )}`,
              )
            }
            if (entry.mapSize) {
              log += colors.dim(
                ` │ map: ${displaySize(entry.mapSize).padStart(mapPad)}`,
              )
            }
            env.logger.info(log)
          }
        }
      } else {
        hasLargeChunks = Object.values(output).some((chunk) => {
          return chunk.type === 'chunk' && chunk.code.length / 1000 > chunkLimit
        })
      }

      if (
        hasLargeChunks &&
        env.options.build.minify &&
        !env.config.build.lib &&
        !env.options.build.ssr
      ) {
        env.logger.warn(
          colors.yellow(
            `\n(!) Some chunks are larger than ${chunkLimit} kB after minification. Consider:\n` +
              `- Using dynamic import() to code-split the application\n` +
              `- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks\n` +
              `- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.`,
          ),
        )
      }
    },
  }
}

function writeLine(output: string) {
  clearLine()
  if (output.length < process.stdout.columns) {
    process.stdout.write(output)
  } else {
    process.stdout.write(output.substring(0, process.stdout.columns - 1))
  }
}

function clearLine() {
  process.stdout.clearLine(0)
  process.stdout.cursorTo(0)
}

function throttle(fn: Function) {
  let timerHandle: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (timerHandle) return
    fn(...args)
    timerHandle = setTimeout(() => {
      timerHandle = null
    }, 100)
  }
}
