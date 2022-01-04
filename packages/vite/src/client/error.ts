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
    return res.url !== undefined;
}

export const getStackLineInformation = (line: string): StackLineResult => {
  let match = RE_CHROME_STACKTRACE.exec(line)
  if (match) {
    let [input, varName, body, line, column] = match
    // strip eval
    if(body.indexOf('eval at') !== -1) {
      body = body.replace(/(eval at.*\()|(\),.*)/g, '')
      const lcMatch = /(.*):(\d+)?:(\d+)?$/.exec(body);
      if(lcMatch) {
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


    if((/> eval|Function/).test(body)) {
      body = body.replace(/ line (\d+)(?: > eval line \d+|(?: > eval|Function))*/,':$1')
      const lcMatch = /(.*):(\d+)/.exec(body);
      if(lcMatch) {
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