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
import type { ViteDevServer } from '../..'
import { CLIENT_ERROR_RELAY_PATH } from '../../constants'

export function logBrowserError(
  server: ViteDevServer, 
  stack: string, 
  fragment: string
): void {
  const msg = `${colors.magenta('[browser]')} ${colors.red(stack)}`
  server.config.logger.error(`${msg}\n\n${fragment}`, {
    clear: true,
    timestamp: true,
  })
}

export function errorIngestMiddleware(
  server: ViteDevServer,
): Connect.ErrorHandleFunction {
  const jsonParser = bodyParser.json()
  return function viteErrorIngestMiddleware(req, res, next) {
    if (req.url === CLIENT_ERROR_RELAY_PATH) {
      jsonParser(req, res, async () => {
        const fragment = await getErrorFragment(req.body)
        logBrowserError(server, req.body.stack, fragment)
        res.statusCode = 201
        res.end('')
      })
    } else {
      next()
    }
  }
}

async function getErrorFragment (info) {
  const res = await fetch(info.filename)
  const source = await res.text()
  const filtered = source.split(/\r?\n/g)
    .map((line, i) => [i, line])
    .slice(Math.max(1, info.lineno - 2), info.lineno + 3)
    .filter(([_,line]) => !line.startsWith('//# sourceMappingURL'))
  let fragment = ""
  let padding = String(info.lineno).length
  for (const [lineno, line] of filtered) {
    fragment += `${
      lineno === (info.lineno - 1) ? colors.red('>') : ' '
    }${String(lineno).padStart(padding)} | ${line}`
    if (lineno === (info.lineno - 1)) {
      const leftPadding = Math.max(0, (info.colno - 1) + padding + 5)
      fragment += `${new Array(leftPadding).fill('').join(' ')}${colors.red('^')}\n`
    }
  }
  return fragment
} 
