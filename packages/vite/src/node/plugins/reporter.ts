import path from 'node:path'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'
import colors from 'picocolors'
import type { Plugin } from '../plugin'
import { defineVitePlugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import type { Environment } from '../environment'
import {
  createWeakData,
  isDefined,
  isInNodeModules,
  normalizePath,
} from '../utils'
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

const COMPRESSIBLE_ASSETS_RE = /\.(?:html|json|svg|txt|xml|xhtml)$/

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
  const getData = createWeakData((environment: Environment) => {
    const data = {
      hasTransformed: false,
      hasRenderedChunk: false,
      hasCompressChunk: false,
      transformedCount: 0,
      chunkCount: 0,
      compressedCount: 0,
      logTransform: throttle((id: string) => {
        writeLine(
          `transforming (${data.transformedCount}) ${colors.dim(
            path.relative(config.root, id),
          )}`,
        )
      }),
    }
    return data
  })

  async function getCompressedSize(
    environment: Environment,
    code: string | Uint8Array,
  ): Promise<number | null> {
    if (
      environment.options.build.ssr ||
      !environment.options.build.reportCompressedSize
    ) {
      return null
    }
    const data = getData(environment)
    if (shouldLogInfo && !data.hasCompressChunk) {
      if (!tty) {
        config.logger.info('computing gzip size...')
      } else {
        writeLine('computing gzip size (0)...')
      }
      data.hasCompressChunk = true
    }
    const compressed = await compress(
      typeof code === 'string' ? code : Buffer.from(code),
    )
    data.compressedCount++
    if (shouldLogInfo && tty) {
      writeLine(`computing gzip size (${data.compressedCount})...`)
    }
    return compressed.length
  }

  return defineVitePlugin({
    name: 'vite:reporter',
    sharedDuringBuild: true,

    transform(_, id) {
      const data = getData(this.environment)

      data.transformedCount++
      if (shouldLogInfo) {
        if (!tty) {
          if (!data.hasTransformed) {
            config.logger.info(`transforming...`)
          }
        } else {
          if (id.includes(`?`)) return
          data.logTransform(id)
        }
        data.hasTransformed = true
      }
      return null
    },

    buildStart() {
      getData(this.environment).transformedCount = 0
    },

    buildEnd() {
      if (shouldLogInfo) {
        if (tty) {
          clearLine()
        }
        config.logger.info(
          `${colors.green(`✓`)} ${getData(this.environment!).transformedCount} modules transformed.`,
        )
      }
    },

    renderStart() {
      const data = getData(this.environment)
      data.chunkCount = 0
      data.compressedCount = 0
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
      const data = getData(this.environment!)
      data.chunkCount++
      if (shouldLogInfo) {
        if (!tty) {
          if (!data.hasRenderedChunk) {
            config.logger.info('rendering chunks...')
          }
        } else {
          writeLine(`rendering chunks (${data.chunkCount})...`)
        }
        data.hasRenderedChunk = true
      }
      return null
    },

    generateBundle() {
      if (shouldLogInfo && tty) clearLine()
    },

    async writeBundle({ dir: outDir }, output) {
      const environment = this.environment!
      const chunkLimit = environment.options.build.chunkSizeWarningLimit

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
                    compressedSize: await getCompressedSize(
                      environment,
                      chunk.code,
                    ),
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
                      ? await getCompressedSize(environment, chunk.source)
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
              outDir ?? environment.options.build.outDir,
            ),
          ),
        )
        const assetsDir = path.join(environment.options.build.assetsDir, '/')

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
          return chunk.type === 'chunk' && chunk.code.length / 1000 > chunkLimit
        })
      }

      if (
        hasLargeChunks &&
        environment.options.build.minify &&
        !config.build.lib &&
        !environment.options.build.ssr
      ) {
        config.logger.warn(
          colors.yellow(
            `\n(!) Some chunks are larger than ${chunkLimit} kB after minification. Consider:\n` +
              `- Using dynamic import() to code-split the application\n` +
              `- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks\n` +
              `- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.`,
          ),
        )
      }
    },
  })
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
