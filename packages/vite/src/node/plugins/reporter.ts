import path from 'node:path'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'
import colors from 'picocolors'
import type { OutputBundle } from 'rollup'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import type { Environment } from '../environment'
import { perEnvironmentState } from '../environment'
import { isDefined, isInNodeModules, normalizePath } from '../utils'
import { LogLevels } from '../logger'
import { withTrailingSlash } from '../../shared/utils'

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

const COMPRESSIBLE_ASSETS_RE = /\.(?:html|json|svg|txt|xml|xhtml|wasm)$/

export function buildReporterPlugin(config: ResolvedConfig): Plugin {
  const compress = promisify(gzip)

  const numberFormatter = new Intl.NumberFormat('en', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })
  const displaySize = (bytes: number) => {
    return `${numberFormatter.format(bytes / 1000)} kB`
  }

  const tty = process.stdout.isTTY && !process.env.CI
  const shouldLogInfo = LogLevels[config.logLevel || 'info'] >= LogLevels.info

  const modulesReporter = perEnvironmentState((environment: Environment) => {
    let hasTransformed = false
    let transformedCount = 0

    const logTransform = throttle((id: string) => {
      writeLine(
        `transforming (${transformedCount}) ${colors.dim(
          path.relative(config.root, id),
        )}`,
      )
    })

    return {
      reset() {
        transformedCount = 0
      },
      register(id: string) {
        transformedCount++
        if (shouldLogInfo) {
          if (!tty) {
            if (!hasTransformed) {
              config.logger.info(`transforming...`)
            }
          } else {
            if (id.includes(`?`)) return
            logTransform(id)
          }
          hasTransformed = true
        }
      },
      log() {
        if (shouldLogInfo) {
          if (tty) {
            clearLine()
          }
          environment.logger.info(
            `${colors.green(`✓`)} ${transformedCount} modules transformed.`,
          )
        }
      },
    }
  })

  const chunksReporter = perEnvironmentState((environment: Environment) => {
    let hasRenderedChunk = false
    let hasCompressChunk = false
    let chunkCount = 0
    let compressedCount = 0

    async function getCompressedSize(
      code: string | Uint8Array,
    ): Promise<number | null> {
      if (
        environment.config.consumer !== 'client' ||
        !environment.config.build.reportCompressedSize
      ) {
        return null
      }
      if (shouldLogInfo && !hasCompressChunk) {
        if (!tty) {
          config.logger.info('computing gzip size...')
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

    return {
      reset() {
        chunkCount = 0
        compressedCount = 0
      },
      register() {
        chunkCount++
        if (shouldLogInfo) {
          if (!tty) {
            if (!hasRenderedChunk) {
              environment.logger.info('rendering chunks...')
            }
          } else {
            writeLine(`rendering chunks (${chunkCount})...`)
          }
          hasRenderedChunk = true
        }
      },
      async log(output: OutputBundle, outDir?: string) {
        const chunkLimit = environment.config.build.chunkSizeWarningLimit

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
                      size: Buffer.byteLength(chunk.code),
                      compressedSize: await getCompressedSize(chunk.code),
                      mapSize: chunk.map
                        ? Buffer.byteLength(chunk.map.toString())
                        : null,
                    }
                  } else {
                    if (chunk.fileName.endsWith('.map')) return null
                    const isCSS = chunk.fileName.endsWith('.css')
                    const isCompressible =
                      isCSS || COMPRESSIBLE_ASSETS_RE.test(chunk.fileName)
                    return {
                      name: chunk.fileName,
                      group: isCSS ? 'CSS' : 'Assets',
                      size: Buffer.byteLength(chunk.source),
                      mapSize: null, // Rollup doesn't support CSS maps?
                      compressedSize: isCompressible
                        ? await getCompressedSize(chunk.source)
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
              config.root,
              path.resolve(
                config.root,
                outDir ?? environment.config.build.outDir,
              ),
            ),
          )
          const assetsDir = path.join(environment.config.build.assetsDir, '/')

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
                !config.build.lib &&
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
              config.logger.info(log)
            }
          }
        } else {
          hasLargeChunks = Object.values(output).some((chunk) => {
            return (
              chunk.type === 'chunk' && chunk.code.length / 1000 > chunkLimit
            )
          })
        }

        if (
          hasLargeChunks &&
          environment.config.build.minify &&
          !config.build.lib &&
          environment.config.consumer === 'client'
        ) {
          environment.logger.warn(
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
  })

  return {
    name: 'vite:reporter',
    sharedDuringBuild: true,
    perEnvironmentStartEndDuringDev: true,

    transform(_, id) {
      modulesReporter(this).register(id)
    },

    buildStart() {
      modulesReporter(this).reset()
    },

    buildEnd() {
      modulesReporter(this).log()
    },

    renderStart() {
      chunksReporter(this).reset()
    },

    renderChunk(_, chunk, options) {
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

      chunksReporter(this).register()
    },

    generateBundle() {
      if (shouldLogInfo && tty) clearLine()
    },

    async writeBundle({ dir }, output) {
      await chunksReporter(this).log(output, dir)
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
