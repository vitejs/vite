import path from 'path'
import chalk from 'chalk'
import _debug from 'debug'
import { Service, Message, Loader, TransformOptions } from 'esbuild'
import { Plugin } from '../config'
import { generateCodeFrame } from '../utils'

const debug = _debug('vite:esbuild')

// lazy start the service
let _servicePromise: Promise<Service> | undefined

export async function ensureService() {
  if (!_servicePromise) {
    _servicePromise = require('esbuild').startService()
  }
  return _servicePromise!
}

export async function stopService() {
  if (_servicePromise) {
    const service = await _servicePromise
    service.stop()
    _servicePromise = undefined
  }
}

export function esbuildPlugin(options?: TransformOptions): Plugin {
  return {
    name: 'vite:esbuild',
    async transform(code, id) {
      if (/\.(tsx?|jsx)$/.test(id)) {
        const service = await ensureService()
        const resolvedOptions = {
          loader: path.extname(id).slice(1) as Loader,
          sourcemap: true,
          // ensure source file name contains full query
          sourcefile: id,
          target: 'es2020',
          ...options
        }

        try {
          const result = await service.transform(code, resolvedOptions)
          if (result.warnings.length) {
            result.warnings.forEach((m) => {
              this.warn(prettifyMessage(m, code))
            })
          }
          return {
            code: result.code,
            map: result.map
          }
        } catch (e) {
          debug(`esbuild error with options used: `, resolvedOptions)
          if (e.errors) {
            e.errors.forEach((m: Message) => {
              e.message += `\n` + prettifyMessage(m, code)
            })
          }
          this.error(e)
        }
      }
    }
  }
}

function prettifyMessage(m: Message, code: string): string {
  let res = chalk.yellow(m.text)
  if (m.location) {
    const lines = code.split(/\r?\n/g)
    const line = Number(m.location.line)
    const column = Number(m.location.column)
    const offset =
      lines
        .slice(0, line - 1)
        .map((l) => l.length)
        .reduce((total, l) => total + l + 1, 0) + column
    res += `\n` + generateCodeFrame(code, offset, offset + 1)
  }
  return res + `\n`
}
