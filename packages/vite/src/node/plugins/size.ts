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

export function sizeReporPlugin(config: ResolvedConfig): Plugin {
  const options = config.build

  function printFileInfo(
    filePath: string,
    content: string | Uint8Array,
    type: WriteType
  ) {
    const needCompression =
      type === WriteType.JS || type === WriteType.CSS || type === WriteType.HTML

    const compressed = needCompression
      ? `, brotli: ${(
          brotliSizeSync(
            typeof content === 'string' ? content : Buffer.from(content)
          ) / 1024
        ).toFixed(2)}kb`
      : ``

    config.logger.info(
      `${chalk.gray(`[write]`)} ${writeColors[type](
        path.relative(process.cwd(), filePath)
      )} ${(content.length / 1024).toFixed(2)}kb${compressed}`
    )
  }

  return {
    name: 'vite:size',
    generateBundle(_, output) {
      for (const file in output) {
        const chunk = output[file]
        if (chunk.type === 'chunk') {
          const filePath = path.join(options.assetsDir, chunk.fileName)
          printFileInfo(filePath, chunk.code, WriteType.JS)
          if (chunk.map) {
            printFileInfo(
              filePath + '.map',
              chunk.map.toString(),
              WriteType.SOURCE_MAP
            )
          }
        } else if (options.emitAssets && chunk.source) {
          printFileInfo(
            path.join(options.assetsDir, chunk.fileName),
            chunk.source,
            chunk.fileName.endsWith('.css') ? WriteType.CSS : WriteType.ASSET
          )
        }
      }
    }
  }
}
