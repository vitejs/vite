import type { RawSourceMap } from 'source-map'
import { SourceMapConsumer } from 'source-map'
import type { ErrorPayload } from 'types/hmrPayload'

export const transformError = (error: any): Error => {
  if (error instanceof Error) {
    return error
  }

  const e = Error(error ?? 'unknown')
  e.stack = `a non-error was thrown please check your browser's devtools for more information`
  return e
}

// TODO Clean up these regex
const RE_CHROME_STACKTRACE =
  /^ {4}at (?:(.+?)\s+)?\(?(.+?)(?::(\d+))?(?::(\d+))?\)?$/
const RE_FIREFOX_STACKTRACE =
  /^(?:(?:(^|.+?)@))\(?(.+?)(?::(\d+))?(?::(\d+))?\)?$/

export interface StackLineInfo {
  input: string
  varName: string
  url: string
  line: number
  column: number
  vendor: 'chrome' | 'firefox'
}

export type StackLineResult = Partial<StackLineInfo> & { input: string }

export const isStackLineInfo = (res: StackLineResult): res is StackLineInfo => {
  return res.url !== undefined
}

export const getStackLineInformation = (line: string): StackLineResult => {
  let match = RE_CHROME_STACKTRACE.exec(line)
  if (match) {
    let [input, varName, body, line, column] = match
    // strip eval
    if (body.indexOf('eval at') !== -1) {
      body = body.replace(/(eval at.*\()|(\),.*)/g, '')
      const lcMatch = /(.*):(\d+)?:(\d+)?$/.exec(body)
      if (lcMatch) {
        body = lcMatch[1]
        line = lcMatch[2]
        column = lcMatch[3]
      } else {
        // can't extract line column
        return {
          input
        }
      }
    }

    return {
      input,
      varName,
      url: body,
      line: Number(line),
      column: Number(column),
      vendor: 'chrome' as const
    }
  }

  match = RE_FIREFOX_STACKTRACE.exec(line)
  if (match) {
    let [input, varName, body, line, column] = match
    // strip eval & function

    if (/> eval|Function/.test(body)) {
      body = body.replace(
        / line (\d+)(?: > eval line \d+|(?: > eval|Function))*/,
        ':$1'
      )
      const lcMatch = /(.*):(\d+)/.exec(body)
      if (lcMatch) {
        body = lcMatch[1]
        line = lcMatch[2]
        column = ''
      } else {
        return {
          // can't extract column
          input
        }
      }
    }

    return {
      input: input,
      varName: varName,
      url: body,
      line: Number(line),
      column: Number(column),
      vendor: 'firefox' as const
    }
  }

  return {
    input: line
  }
}

const extractSourceMapData = (fileContent: string) => {
  const re = /[#@]\ssourceMappingURL=\s*(\S+)/gm
  let match: RegExpExecArray | null = null
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const next = re.exec(fileContent)
    if (next == null) {
      break
    }
    match = next
  }

  if (!(match && match[0])) {
    return null
  }

  return match[1]
}

const getSourceMapForFile = async (
  fileName: string
): Promise<{
  sourceMapConsumer?: SourceMapConsumer
  baseSource: string
}> => {
  const source = await (await fetch(fileName)).text()
  const sourceMapData = extractSourceMapData(source)

  if (!sourceMapData) {
    return { baseSource: source }
  }

  // TODO: extract this string to a const
  if (sourceMapData.indexOf('data:application/json;base64,') === 0) {
    let sm = sourceMapData.substring('data:application/json;base64,'.length)
    sm = window.atob(sm)
    const sourceMapConsumer = new SourceMapConsumer(
      JSON.parse(sm) as RawSourceMap
    )

    return {
      baseSource: source,
      sourceMapConsumer
    }
  }

  // TODO: add support for url source maps
  return {
    baseSource: source
  }
}

const generateFrame = (
  line: number,
  column: number,
  source: string,
  count = 2
): string => {
  const lines = source.split('\n')
  const result: string[] = []

  for (
    let index = Math.max(0, line - 1 - count);
    index <= Math.min(lines.length - 1, line - 1 + count);
    ++index
  ) {
    const lineNumber = index + 1
    result.push(`${lineNumber.toString().padEnd(3)}|  ${lines[index]}`)
    if (index === line - 1) {
      result.push(
        ''.padStart(Math.max(index.toString().length, 3)) +
          '|  ' +
          '^'.padStart(column + 1)
      )
    }
  }

  return result.join('\n')
}

const transformStackTrace = async (stack: string): Promise<string> => {
  return (
    await Promise.all(
      stack.split('\n').map(async (l) => {
        const result = getStackLineInformation(l)

        if (!isStackLineInfo(result)) return result.input

        const { input, varName, url, line, column, vendor } = result
        const { sourceMapConsumer } = await getSourceMapForFile(url)

        if (!(sourceMapConsumer instanceof SourceMapConsumer)) {
          return input
        }

        const pos = sourceMapConsumer.originalPositionFor({
          line: line,
          column: column
        })

        if (!pos.source) {
          return input
        }

        if (vendor === 'chrome') {
          const source = `${pos.source}:${pos.line || 0}:${pos.column || 0}`
          if (!varName || varName === 'eval') {
            return `    at ${source}`
          } else {
            return `    at ${varName} (${source})`
          }
        } else {
          // TODO: strip eval and function
          return `${varName}@${pos.source}:${pos.line || 0}:${pos.column || 0}`
        }
      })
    )
  ).join('\n')
}

export const generateErrorPayload = async (
  message: string,
  filename: string,
  lineno: number,
  colno: number,
  stack: string
): Promise<ErrorPayload['err']> => {
  const { sourceMapConsumer, baseSource } = await getSourceMapForFile(filename)

  let source = baseSource
  let loc = {
    line: lineno,
    column: colno,
    file: filename
  }
  if (sourceMapConsumer instanceof SourceMapConsumer) {
    const {
      line,
      column,
      source: sourceFileName
    } = sourceMapConsumer.originalPositionFor({
      line: lineno,
      column: colno
    })

    source = sourceMapConsumer.sourceContentFor(sourceFileName)
    loc = {
      file:
        // Leave internal vite files alone
        sourceFileName && !filename.includes('@vite')
          ? sourceFileName
          : loc.file,
      line,
      column
    }
  }

  const frame = generateFrame(loc.line, loc.column, source)

  return {
    message,
    stack: await transformStackTrace(stack),
    loc,
    frame
  }
}
