import path from 'path'
import chalk from 'chalk'
import { Plugin } from 'rollup'
import { ResolvedConfig } from '../config'
import { sync as brotliSizeSync } from 'brotli-size'

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
  function printFileInfo(
    filePath: string,
    content: string | Uint8Array,
    type: WriteType,
    maxLength: number
  ) {
    const needCompression =
      type === WriteType.JS || type === WriteType.CSS || type === WriteType.HTML

    const compressed = needCompression
      ? ` / brotli: ${(
          brotliSizeSync(
            typeof content === 'string' ? content : Buffer.from(content)
          ) / 1024
        ).toFixed(2)}kb`
      : ``

    let outDir = path.posix.relative(process.cwd(), config.build.outDir)
    if (!outDir.endsWith('/')) outDir += '/'
    config.logger.info(
      `${chalk.gray(chalk.white.dim(outDir))}${writeColors[type](
        filePath.padEnd(maxLength + 2)
      )} ${chalk.dim(`${(content.length / 1024).toFixed(2)}kb${compressed}`)}`
    )
  }

  return {
    name: 'vite:size',
    writeBundle(_, output) {
      let longest = 0
      for (const file in output) {
        const l = output[file].fileName.length
        if (l > longest) longest = l
      }

      for (const file in output) {
        const chunk = output[file]
        if (chunk.type === 'chunk') {
          printFileInfo(chunk.fileName, chunk.code, WriteType.JS, longest)
          if (chunk.map) {
            printFileInfo(
              chunk.fileName + '.map',
              chunk.map.toString(),
              WriteType.SOURCE_MAP,
              longest
            )
          }
        } else if (chunk.source) {
          printFileInfo(
            chunk.fileName,
            chunk.source,
            chunk.fileName.endsWith('.css') ? WriteType.CSS : WriteType.ASSET,
            longest
          )
        }
      }
    }
  }
}
