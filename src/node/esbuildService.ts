import path from 'path'
import { startService, Service, TransformOptions, Message } from 'esbuild'
import chalk from 'chalk'
import { generateCodeFrame } from '@vue/compiler-sfc'

const debug = require('debug')('vite:esbuild')

export const tjsxRE = /\.(tsx?|jsx)$/

// lazy start the service
let _service: Service | undefined

const ensureService = async () => {
  if (!_service) {
    _service = await startService()
  }
  return _service
}

export const stopService = () => {
  _service && _service.stop()
}

const sourceMapRE = /\/\/# sourceMappingURL.*/

// transform used in server plugins with a more friendly API
export const transform = async (
  code: string,
  file: string,
  options: TransformOptions = {}
) => {
  const service = await ensureService()
  options = {
    ...options,
    loader: options.loader || (path.extname(file).slice(1) as any),
    sourcemap: true
  }
  try {
    const result = await service.transform(code, options)
    if (result.warnings.length) {
      console.error(`[vite] warnings while transforming ${file} with esbuild:`)
      result.warnings.forEach((m) => printMessage(m, code))
    }
    return {
      code: (result.js || '').replace(sourceMapRE, ''),
      map: result.jsSourceMap
    }
  } catch (e) {
    console.error(
      chalk.red(`[vite] error while transforming ${file} with esbuild:`)
    )
    e.errors.forEach((m: Message) => printMessage(m, code))
    debug(`options used: `, options)
    return {
      code: '',
      map: undefined
    }
  }
}

function printMessage(m: Message, code: string) {
  console.error(chalk.yellow(m.text))
  if (m.location) {
    const lines = code.split(/\r?\n/g)
    const line = Number(m.location.line)
    const column = Number(m.location.column)
    const offset =
      lines
        .slice(0, line - 1)
        .map((l) => l.length)
        .reduce((total, l) => total + l + 1, 0) + column
    console.error(generateCodeFrame(code, offset, offset + 1))
  }
}
