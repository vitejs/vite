import type { RollupError } from 'rollup'
// bank on the non-overlapping nature of regex matches and combine all filters into one giant regex
// /`([^`\$\{\}]|\$\{(`|\g<1>)*\})*`/g can match nested string template
// but js not support match expression(\g<0>). so clean string template(`...`) in other ways.
const cleanerRE = /"[^"]*"|'[^']*'|\/\*(.|[\r\n])*?\*\/|\/\/.*/g

const blankReplacer = (s: string) => ' '.repeat(s.length)
const stringBlankReplacer = (s: string) =>
  `${s[0]}${'\0'.repeat(s.length - 2)}${s[0]}`

export function emptyString(raw: string): string {
  let res = raw.replace(cleanerRE, (s: string) =>
    s[0] === '/' ? blankReplacer(s) : stringBlankReplacer(s)
  )

  let lastEnd = 0
  let start = 0
  while ((start = res.indexOf('`', lastEnd)) >= 0) {
    let clean
    ;[clean, lastEnd] = lexStringTemplateExpression(res, start)
    res = replaceAt(res, start, lastEnd, clean)
  }

  return res
}

const enum LexerState {
  inTemplateString,
  inInterpolationExpression,
  inObjectExpression
}

function replaceAt(
  string: string,
  start: number,
  end: number,
  replacement: string
): string {
  return string.slice(0, start) + replacement + string.slice(end)
}

/**
 * lex string template and clean it.
 */
function lexStringTemplateExpression(
  code: string,
  start: number
): [string, number] {
  let state = LexerState.inTemplateString as LexerState
  let clean = '`'
  const opStack: LexerState[] = [state]

  function pushStack(newState: LexerState) {
    state = newState
    opStack.push(state)
  }

  function popStack() {
    opStack.pop()
    state = opStack[opStack.length - 1]
  }

  let i = start + 1
  outer: for (; i < code.length; i++) {
    const char = code.charAt(i)
    switch (state) {
      case LexerState.inTemplateString:
        if (char === '$' && code.charAt(i + 1) === '{') {
          pushStack(LexerState.inInterpolationExpression)
          clean += '${'
          i++ // jump next
        } else if (char === '`') {
          popStack()
          clean += char
          if (opStack.length === 0) {
            break outer
          }
        } else {
          clean += '\0'
        }
        break
      case LexerState.inInterpolationExpression:
        if (char === '{') {
          pushStack(LexerState.inObjectExpression)
          clean += char
        } else if (char === '}') {
          popStack()
          clean += char
        } else if (char === '`') {
          pushStack(LexerState.inTemplateString)
          clean += char
        } else {
          clean += char
        }
        break
      case LexerState.inObjectExpression:
        if (char === '}') {
          popStack()
          clean += char
        } else if (char === '`') {
          pushStack(LexerState.inTemplateString)
          clean += char
        } else {
          clean += char
        }
        break
      default:
        throw new Error('unknown string template lexer state')
    }
  }

  if (opStack.length !== 0) {
    error(start)
  }

  return [clean, i + 1]
}

function error(pos: number) {
  const err = new Error(
    `can not match string template expression.`
  ) as RollupError
  err.pos = pos
  throw err
}
