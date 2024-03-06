import path from 'node:path'
import MagicString from 'magic-string'
import type { RollupError } from 'rollup'
import { stripLiteral } from 'strip-literal'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { evalValue, injectQuery, transformStableResult } from '../utils'
import type { ResolveFn } from '..'
import { cleanUrl, slash } from '../../shared/utils'
import type { WorkerType } from './worker'
import { WORKER_FILE_ID, workerFileToUrl } from './worker'
import { fileToUrl } from './asset'
import type { InternalResolveOptions } from './resolve'
import { tryFsResolve } from './resolve'
import { hasViteIgnoreRE } from './importAnalysis'

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

  const hasViteIgnore = hasViteIgnoreRE.test(workerOptString)
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

function isIncludeWorkerImportMetaUrl(code: string): boolean {
  if (
    (code.includes('new Worker') || code.includes('new SharedWorker')) &&
    code.includes('new URL') &&
    code.includes(`import.meta.url`)
  ) {
    return true
  }
  return false
}

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  let workerResolver: ResolveFn

  const fsResolveOptions: InternalResolveOptions = {
    ...config.resolve,
    root: config.root,
    isProduction: config.isProduction,
    isBuild: config.command === 'build',
    packageCache: config.packageCache,
    ssrConfig: config.ssr,
    asSrc: true,
  }

  return {
    name: 'vite:worker-import-meta-url',

    shouldTransformCachedModule({ code }) {
      if (isBuild && config.build.watch && isIncludeWorkerImportMetaUrl(code)) {
        return true
      }
    },

    async transform(code, id, options) {
      if (!options?.ssr && isIncludeWorkerImportMetaUrl(code)) {
        let s: MagicString | undefined
        const cleanString = stripLiteral(code)
        const workerImportMetaUrlRE =
          /\bnew\s+(?:Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/dg

        let match: RegExpExecArray | null
        while ((match = workerImportMetaUrlRE.exec(cleanString))) {
          const [[, endIndex], [expStart, expEnd], [urlStart, urlEnd]] =
            match.indices!

          const rawUrl = code.slice(urlStart, urlEnd)

          // potential dynamic template string
          if (rawUrl[0] === '`' && rawUrl.includes('${')) {
            this.error(
              `\`new URL(url, import.meta.url)\` is not supported in dynamic template string.`,
              expStart,
            )
          }

          s ||= new MagicString(code)
          const workerType = getWorkerType(code, cleanString, endIndex)
          const url = rawUrl.slice(1, -1)
          let file: string | undefined
          if (url[0] === '.') {
            file = path.resolve(path.dirname(id), url)
            file = tryFsResolve(file, fsResolveOptions) ?? file
          } else {
            workerResolver ??= config.createResolver({
              extensions: [],
              tryIndex: false,
              preferRelative: true,
            })
            file = await workerResolver(url, id)
            file ??=
              url[0] === '/'
                ? slash(path.join(config.publicDir, url))
                : slash(path.resolve(path.dirname(id), url))
          }

          if (
            isBuild &&
            config.isWorker &&
            this.getModuleInfo(cleanUrl(file))?.isEntry
          ) {
            s.update(expStart, expEnd, 'self.location.href')
          } else {
            let builtUrl: string
            if (isBuild) {
              builtUrl = await workerFileToUrl(config, file)
            } else {
              builtUrl = await fileToUrl(cleanUrl(file), config, this)
              builtUrl = injectQuery(
                builtUrl,
                `${WORKER_FILE_ID}&type=${workerType}`,
              )
            }
            s.update(
              expStart,
              expEnd,
              // add `'' +` to skip vite:asset-import-meta-url plugin
              `new URL('' + ${JSON.stringify(builtUrl)}, import.meta.url)`,
            )
          }
        }

        if (s) {
          return transformStableResult(s, id, config)
        }

        return null
      }
    },
  }
}
