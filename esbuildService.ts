import path from 'path'
import chalk from 'chalk'
import { startService, Service, TransformOptions, Message } from 'esbuild'

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
  _service = undefined
}

export const queryRE = /\?.*$/
export const hashRE = /#.*$/

export const cleanUrl = (url: string) =>
  url.replace(hashRE, '').replace(queryRE, '')

const sourceMapRE = /\/\/# sourceMappingURL.*/

// transform used in server plugins with a more friendly API
export const transform = async (
  src: string,
  request: string,
  options: TransformOptions = {}
) => {
  const service = await ensureService()
  const file = cleanUrl(request)
  options = {
    ...options,
    loader: options.loader || (path.extname(file).slice(1) as any),
    sourcemap: true,
    sourcefile: request, // ensure source file name contains full query
    target: 'es2019'
  }
  try {
    const result = await service.transform(src, options)
    if (result.warnings.length) {
      console.error(`[vite] warnings while transforming ${file} with esbuild:`)
      result.warnings.forEach((m) => printMessage(m, src))
    }

    let code = (result.js || '').replace(sourceMapRE, '')

    return {
      code,
      map: result.jsSourceMap
    }
  } catch (e) {
    console.error(
      chalk.red(`[vite] error while transforming ${file} with esbuild:`)
    )
    if (e.errors) {
      e.errors.forEach((m: Message) => printMessage(m, src))
    } else {
      console.error(e)
    }
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
    console.error(
      generateCodeFrame(code, offset, offset + 1)
    )
  }
}


const range: number = 2

export function generateCodeFrame(
  source: string,
  start = 0,
  end = source.length
): string {
  const lines = source.split(/\r?\n/)
  let count = 0
  const res: string[] = []
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + 1
    if (count >= start) {
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) continue
        const line = j + 1
        res.push(`${line}${' '.repeat(3 - String(line).length)}|  ${lines[j]}`)
        const lineLength = lines[j].length
        if (j === i) {
          // push underline
          const pad = start - (count - lineLength) + 1
          const length = Math.max(
            1,
            end > count ? lineLength - pad : end - start
          )
          res.push(`   |  ` + ' '.repeat(pad) + '^'.repeat(length))
        } else if (j > i) {
          if (end > count) {
            const length = Math.max(Math.min(end - count, lineLength), 1)
            res.push(`   |  ` + '^'.repeat(length))
          }
          count += lineLength + 1
        }
      }
      break
    }
  }
  return res.join('\n')
}
