import path from 'node:path'
import repl from 'node:repl'
import { readFileSync } from 'fs';

import { stripVTControlCharacters as strip } from 'node:util'
import colors from 'picocolors'
import type { RollupError } from 'rollup'
import bodyParser from 'body-parser'
import type { Connect } from 'dep-types/connect'
import type { ErrorPayload } from 'types/hmrPayload'
import { pad } from '../../utils'
import type { ResolvedConfig } from '../..'
import { CLIENT_ERROR_RELAY_PATH } from '../../constants'

export interface BrowserErrorInfo {
  type: 'browser-error'
  stack: string
  lineno: number
  colno: number
  message: string
}

export async function logBrowserError(
  source: string,
  error: BrowserErrorInfo, 
  stack: string,
  config: ResolvedConfig
) {
  const fragment = await getErrorFragment(error, source)
  const msg = `${colors.magenta('[browser]')} ${colors.red(stack)}`
  config.logger.error(`${msg}\n\n${fragment}`, {
    clear: true,
    timestamp: true,
  })
}

async function getErrorFragment (error, source) {
  const filtered = source.split(/\r?\n/g)
    .map((line, i) => [i, line])
    .slice(Math.max(1, error.lineno - 2), error.lineno + 3)
  let fragment = ""
  let padding = String(error.lineno).length
  for (const [lineno, line] of filtered) {
    fragment += `${
      lineno === (error.lineno - 1) ? colors.red('>') : ' '
    }${String(lineno).padStart(padding)} | ${line}\n`
    if (lineno === (error.lineno - 1)) {
      const leftPadding = Math.max(0, (error.colno - 1) + padding + 5)
      fragment += `${new Array(leftPadding).fill('').join(' ')}${colors.red('^')}\n`
    }
  }
  return fragment
} 
