import path from 'node:path'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'
import colors from 'picocolors'
import type { Plugin } from 'rollup'
import type { ResolvedConfig } from '../config'
import { isDefined, normalizePath } from '../utils'
import { LogLevels } from '../logger'

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
  const chunkLimit = config.build.chunkSizeWarningLimit

  const tty = process.stdout.isTTY && !process.env.CI
  const shouldLogInfo = LogLevels[config.logLevel || 'info'] >= LogLevels.info
  let hasTransformed = false
  let hasRenderedChunk = false
  let hasCompressChunk = false
  let transformedCount = 0
  let chunkCount = 0
  let compressedCount = 0
  let startTime = Date.now()

  async function getCompressedSize(
    code: string | Uint8Array,
  ): Promise<number | null> {
    if (config.build.ssr || !config.build.reportCompressedSize) {
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

  const logTransform = throttle((id: string) => {
    writeLine(
      `transforming (${transformedCount}) ${colors.dim(
        path.relative(config.root, id),
      )}`,
    )
  })

  return {
    name: 'vite:reporter',

    transform(_, id) {
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
      return null
    },

    options() {
      startTime = Date.now()
    },

    buildStart() {
      transformedCount = 0
    },

    buildEnd() {
      if (shouldLogInfo) {
        if (tty) {
          process.stdout.clearLine(0)
          process.stdout.cursorTo(0)
        }
        config.logger.info(
          `${colors.green(`✓`)} ${transformedCount} modules transformed.`,
        )
      }
    },

    renderStart() {
      chunkCount = 0
      compressedCount = 0
    },

    renderChunk() {
      chunkCount++
      if (shouldLogInfo) {
        if (!tty) {
          if (!hasRenderedChunk) {
            config.logger.info('rendering chunks...')
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
                    compressedSize: await getCompressedSize(chunk.code),
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
            path.resolve(config.root, outDir ?? config.build.outDir),
          ),
        )
        const assetsDir = path.join(config.build.assetsDir, '/')

        for (const group of groups) {
          const filtered = entries.filter((e) => e.group === group.name)
          if (!filtered.length) continue
          for (const entry of filtered.sort((a, z) => a.size - z.size)) {
            const isLarge =
              group.name === 'JS' && entry.size / 1000 > chunkLimit
            if (isLarge) hasLargeChunks = true
            const sizeColor = isLarge ? colors.yellow : colors.dim
            let log = colors.dim(relativeOutDir + '/')
            log +=
              !config.build.lib && entry.name.startsWith(assetsDir)
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
        config.build.minify &&
        !config.build.lib &&
        !config.build.ssr
      ) {
        config.logger.warn(
          colors.yellow(
            `\n(!) Some chunks are larger than ${chunkLimit} kBs after minification. Consider:\n` +
              `- Using dynamic import() to code-split the application\n` +
              `- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks\n` +
              `- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.`,
          ),
        )
      }
    },

    closeBundle() {
      if (shouldLogInfo && !config.build.watch) {
        config.logger.info(
          `${colors.green(`✓`)} built in ${displayTime(
            Date.now() - startTime,
          )}`,
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

function displaySize(bytes: number) {
  return `${(bytes / 1000).toLocaleString('en', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} kB`
}

function displayTime(time: number) {
  // display: {X}ms
  if (time < 1000) {
    return `${time}ms`
  }

  time = time / 1000

  // display: {X}s
  if (time < 60) {
    return `${time.toFixed(2)}s`
  }

  const mins = parseInt((time / 60).toString())
  const seconds = time % 60

  // display: {X}m {Y}s
  return `${mins}m${seconds < 1 ? '' : ` ${seconds.toFixed(0)}s`}`
}
