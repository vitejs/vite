import path from 'node:path'
import MagicString from 'magic-string'
import type { RollupError } from 'rollup'
import { stripLiteral } from 'strip-literal'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import {
  cleanUrl,
  evalValue,
  injectQuery,
  parseRequest,
  slash,
  transformStableResult,
} from '../utils'
import { getDepsOptimizer } from '../optimizer'
import type { ResolveFn } from '..'
import type { WorkerType } from './worker'
import { WORKER_FILE_ID, workerFileToUrl } from './worker'
import { fileToUrl } from './asset'

const ignoreFlagRE = /\/\*\s*@vite-ignore\s*\*\//

interface WorkerOptions {
  type?: WorkerType
}

function err(e: string, pos: number) {
  const error = new Error(e) as RollupError
  error.pos = pos
  return error
}

function parseWorkerOptions(
  rawOpts: string,
  optsStartIndex: number,
): WorkerOptions {
  let opts: WorkerOptions = {}
  try {
    opts = evalValue<WorkerOptions>(rawOpts)
  } catch {
    throw err(
      'Vite is unable to parse the worker options as the value is not static.' +
        'To ignore this error, please use /* @vite-ignore */ in the worker options.',
      optsStartIndex,
    )
  }

  if (opts == null) {
    return {}
  }

  if (typeof opts !== 'object') {
    throw err(
      `Expected worker options to be an object, got ${typeof opts}`,
      optsStartIndex,
    )
  }

  return opts
}

function getWorkerType(raw: string, clean: string, i: number): WorkerType {
  const commaIndex = clean.indexOf(',', i)
  if (commaIndex === -1) {
    return 'classic'
  }
  const endIndex = clean.indexOf(')', i)

  // case: ') ... ,' mean no worker options params
  if (commaIndex > endIndex) {
    return 'classic'
  }

  // need to find in comment code
  const workerOptString = raw
    .substring(commaIndex + 1, endIndex)
    .replace(/\}[\s\S]*,/g, '}') // strip trailing comma for parsing

  const hasViteIgnore = ignoreFlagRE.test(workerOptString)
  if (hasViteIgnore) {
    return 'ignore'
  }

  // need to find in no comment code
  const cleanWorkerOptString = clean.substring(commaIndex + 1, endIndex).trim()
  if (!cleanWorkerOptString.length) {
    return 'classic'
  }

  const workerOpts = parseWorkerOptions(workerOptString, commaIndex + 1)
  if (workerOpts.type && ['classic', 'module'].includes(workerOpts.type)) {
    return workerOpts.type
  }

  return 'classic'
}

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  let workerResolver: ResolveFn

  return {
    name: 'vite:worker-import-meta-url',

    async transform(code, id, options) {
      const ssr = options?.ssr === true
      if (
        !options?.ssr &&
        (code.includes('new Worker') || code.includes('new SharedWorker')) &&
        code.includes('new URL') &&
        code.includes(`import.meta.url`)
      ) {
        const query = parseRequest(id)
        let s: MagicString | undefined
        const cleanString = stripLiteral(code)
        const workerImportMetaUrlRE =
          /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/g

        let match: RegExpExecArray | null
        while ((match = workerImportMetaUrlRE.exec(cleanString))) {
          const { 0: allExp, 1: exp, 2: emptyUrl, index } = match
          const urlIndex = allExp.indexOf(exp) + index

          const urlStart = cleanString.indexOf(emptyUrl, index)
          const urlEnd = urlStart + emptyUrl.length
          const rawUrl = code.slice(urlStart, urlEnd)

          // potential dynamic template string
          if (rawUrl[0] === '`' && rawUrl.includes('${')) {
            this.error(
              `\`new URL(url, import.meta.url)\` is not supported in dynamic template string.`,
              urlIndex,
            )
          }

          s ||= new MagicString(code)
          const workerType = getWorkerType(
            code,
            cleanString,
            index + allExp.length,
          )
          const url = rawUrl.slice(1, -1)
          let file: string | undefined
          if (url.startsWith('.')) {
            file = path.resolve(path.dirname(id), url)
          } else {
            workerResolver ??= config.createResolver({
              extensions: [],
              tryIndex: false,
              preferRelative: true,
            })
            file = await workerResolver(url, id)
            file ??= url.startsWith('/')
              ? slash(path.join(config.publicDir, url))
              : slash(path.resolve(path.dirname(id), url))
          }

          let builtUrl: string
          if (isBuild) {
            getDepsOptimizer(config, ssr)?.registerWorkersSource(id)
            builtUrl = await workerFileToUrl(config, file, query)
          } else {
            builtUrl = await fileToUrl(cleanUrl(file), config, this)
            builtUrl = injectQuery(builtUrl, WORKER_FILE_ID)
            builtUrl = injectQuery(builtUrl, `type=${workerType}`)
          }
          s.update(
            urlIndex,
            urlIndex + exp.length,
            `new URL(${JSON.stringify(builtUrl)}, self.location)`,
          )
        }

        if (s) {
          return transformStableResult(s, id, config)
        }

        return null
      }
    },
  }
}
