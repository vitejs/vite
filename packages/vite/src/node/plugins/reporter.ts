import path from 'node:path'
import { gzip } from 'node:zlib'
import { promisify } from 'node:util'
import colors from 'picocolors'
import type { Plugin } from 'rollup'
import type { ResolvedConfig } from '../config'
import { normalizePath } from '../utils'
import { LogLevels } from '../logger'

const enum WriteType {
  JS,
  CSS,
  ASSET,
  HTML,
  SOURCE_MAP
}

const writeColors = {
  [WriteType.JS]: colors.cyan,
  [WriteType.CSS]: colors.magenta,
  [WriteType.ASSET]: colors.green,
  [WriteType.HTML]: colors.blue,
  [WriteType.SOURCE_MAP]: colors.gray
}

export function buildReporterPlugin(config: ResolvedConfig): Plugin {
  const compress = promisify(gzip)
  const chunkLimit = config.build.chunkSizeWarningLimit

  function isLarge(code: string | Uint8Array): boolean {
    // bail out on particularly large chunks
    return code.length / 1000 > chunkLimit
  }

  async function getCompressedSize(code: string | Uint8Array): Promise<string> {
    if (config.build.ssr || !config.build.reportCompressedSize) {
      return ''
    }
    return ` / gzip: ${displaySize(
      (await compress(typeof code === 'string' ? code : Buffer.from(code)))
        .length / 1000
    )}`
  }

  function printFileInfo(
    filePath: string,
    content: string | Uint8Array,
    type: WriteType,
    maxLength: number,
    outDir = config.build.outDir,
    compressedSize = ''
  ) {
    outDir =
      normalizePath(
        path.relative(config.root, path.resolve(config.root, outDir))
      ) + '/'
    const kB = content.length / 1000
    const sizeColor = kB > chunkLimit ? colors.yellow : colors.dim
    config.logger.info(
      `${colors.gray(colors.white(colors.dim(outDir)))}${writeColors[type](
        filePath.padEnd(maxLength + 2)
      )} ${sizeColor(`${displaySize(kB)}${compressedSize}`)}`
    )
  }

  const tty = process.stdout.isTTY && !process.env.CI
  const shouldLogInfo = LogLevels[config.logLevel || 'info'] >= LogLevels.info
  let hasTransformed = false
  let hasRenderedChunk = false
  let transformedCount = 0
  let chunkCount = 0

  const logTransform = throttle((id: string) => {
    writeLine(
      `transforming (${transformedCount}) ${colors.dim(
        path.relative(config.root, id)
      )}`
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

    buildEnd() {
      if (shouldLogInfo) {
        if (tty) {
          process.stdout.clearLine(0)
          process.stdout.cursorTo(0)
        }
        config.logger.info(
          `${colors.green(`✓`)} ${transformedCount} modules transformed.`
        )
      }
    },

    renderStart() {
      chunkCount = 0
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
      if (shouldLogInfo && tty) {
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
      }
    },

    async writeBundle({ dir: outDir }, output) {
      let hasLargeChunks = false

      if (shouldLogInfo) {
        let longest = 0
        for (const file in output) {
          const l = output[file].fileName.length
          if (l > longest) longest = l
        }

        // large chunks are deferred to be logged at the end so they are more
        // visible.
        const deferredLogs: (() => void)[] = []

        await Promise.all(
          Object.keys(output).map(async (file) => {
            const chunk = output[file]
            if (chunk.type === 'chunk') {
              const log = async () => {
                printFileInfo(
                  chunk.fileName,
                  chunk.code,
                  WriteType.JS,
                  longest,
                  outDir,
                  await getCompressedSize(chunk.code)
                )
                if (chunk.map) {
                  printFileInfo(
                    chunk.fileName + '.map',
                    chunk.map.toString(),
                    WriteType.SOURCE_MAP,
                    longest,
                    outDir
                  )
                }
              }
              if (isLarge(chunk.code)) {
                hasLargeChunks = true
                deferredLogs.push(log)
              } else {
                await log()
              }
            } else if (chunk.source) {
              const isCSS = chunk.fileName.endsWith('.css')
              const isMap = chunk.fileName.endsWith('.js.map')
              printFileInfo(
                chunk.fileName,
                chunk.source,
                isCSS
                  ? WriteType.CSS
                  : isMap
                  ? WriteType.SOURCE_MAP
                  : WriteType.ASSET,
                longest,
                outDir,
                isCSS ? await getCompressedSize(chunk.source) : undefined
              )
            }
          })
        )

        await Promise.all(deferredLogs.map((l) => l()))
      } else {
        hasLargeChunks = Object.keys(output).some((file) => {
          const chunk = output[file]
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
              `- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/guide/en/#outputmanualchunks\n` +
              `- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.`
          )
        )
      }
    }
  }
}

function writeLine(output: string) {
  process.stdout.clearLine(0)
  process.stdout.cursorTo(0)
  if (output.length < process.stdout.columns) {
    process.stdout.write(output)
  } else {
    process.stdout.write(output.substring(0, process.stdout.columns - 1))
  }
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

function displaySize(kB: number) {
  return `${kB.toLocaleString('en', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })} kB`
}
