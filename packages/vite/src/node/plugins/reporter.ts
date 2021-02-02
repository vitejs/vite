import path from 'path'
import chalk from 'chalk'
import { Plugin } from 'rollup'
import { ResolvedConfig } from '../config'
import size from 'brotli-size'
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
  [WriteType.JS]: chalk.cyan,
  [WriteType.CSS]: chalk.magenta,
  [WriteType.ASSET]: chalk.green,
  [WriteType.HTML]: chalk.blue,
  [WriteType.SOURCE_MAP]: chalk.gray
}

export function buildReporterPlugin(config: ResolvedConfig): Plugin {
  const chunkLimit = config.build.chunkSizeWarningLimit

  async function getCompressedSize(code: string | Uint8Array): Promise<string> {
    if (config.build.ssr || !config.build.brotliSize) {
      return ''
    }
    return ` / brotli: ${(
      (await size(typeof code === 'string' ? code : Buffer.from(code))) / 1024
    ).toFixed(2)}kb`
  }

  function printFileInfo(
    filePath: string,
    content: string | Uint8Array,
    type: WriteType,
    maxLength: number,
    compressedSize = ''
  ) {
    const outDir =
      normalizePath(
        path.relative(
          config.root,
          path.resolve(config.root, config.build.outDir)
        )
      ) + '/'
    const kbs = content.length / 1024
    const sizeColor = kbs > chunkLimit ? chalk.yellow : chalk.dim
    config.logger.info(
      `${chalk.gray(chalk.white.dim(outDir))}${writeColors[type](
        filePath.padEnd(maxLength + 2)
      )} ${sizeColor(`${kbs.toFixed(2)}kb${compressedSize}`)}`
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
      `transforming (${transformedCount}) ${chalk.dim(
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
      if (tty) {
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
      }
      config.logger.info(
        `${chalk.green(`✓`)} ${transformedCount} modules transformed.`
      )
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
      if (tty) {
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
      }
    },

    async writeBundle(_, output) {
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
              // bail out on particularly large chunks
              const isLarge = chunk.code.length / 1024 > chunkLimit
              const log = async () => {
                printFileInfo(
                  chunk.fileName,
                  chunk.code,
                  WriteType.JS,
                  longest,
                  isLarge
                    ? ' / brotli: skipped (large chunk)'
                    : await getCompressedSize(chunk.code)
                )
                if (chunk.map) {
                  printFileInfo(
                    chunk.fileName + '.map',
                    chunk.map.toString(),
                    WriteType.SOURCE_MAP,
                    longest
                  )
                }
              }
              if (isLarge) {
                hasLargeChunks = true
                deferredLogs.push(log)
              } else {
                await log()
              }
            } else if (chunk.source) {
              const isCSS = chunk.fileName.endsWith('.css')
              printFileInfo(
                chunk.fileName,
                chunk.source,
                isCSS ? WriteType.CSS : WriteType.ASSET,
                longest,
                isCSS ? await getCompressedSize(chunk.source) : undefined
              )
            }
          })
        )

        await Promise.all(deferredLogs.map((l) => l()))
      } else {
        hasLargeChunks = Object.keys(output).some((file) => {
          const chunk = output[file]
          return chunk.type === 'chunk' && chunk.code.length / 1024 > chunkLimit
        })
      }

      if (
        hasLargeChunks &&
        config.build.minify &&
        !config.build.lib &&
        !config.build.ssr
      ) {
        config.logger.warn(
          chalk.yellow(
            `\n(!) Some chunks are larger than ${chunkLimit}kb after minification. Consider:\n` +
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
