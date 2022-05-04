import JSON5 from 'json5'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { fileToUrl } from './asset'
import { cleanUrl, injectQuery } from '../utils'
import path from 'path'
import { workerFileToUrl } from './worker'
import { parseRequest } from '../utils'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import MagicString from 'magic-string'
import type { ViteDevServer } from '..'
import type { RollupError } from 'rollup'
import { emptyString } from '../cleanString'

type WorkerType = 'classic' | 'module' | 'ignore'
const ignoreFlagRE = /\/\*\s*@vite-ignore\s*\*\//

const WORKER_FILE_ID = 'worker_url_file'

function getWorkerType(raw: string, clean: string, i: number): WorkerType {
  function err(e: string, pos: number) {
    const error = new Error(e) as RollupError
    error.pos = pos
    throw error
  }

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
  const workerOptString = raw.substring(commaIndex + 1, endIndex)

  const hasViteIgnore = ignoreFlagRE.test(workerOptString)
  if (hasViteIgnore) {
    return 'ignore'
  }

  // need to find in no comment code
  const cleanWorkerOptString = clean.substring(commaIndex + 1, endIndex)
  if (!cleanWorkerOptString.trim().length) {
    return 'classic'
  }

  let workerOpts: { type: WorkerType } = { type: 'classic' }
  try {
    workerOpts = JSON5.parse(workerOptString)
  } catch (e) {
    // can't parse by JSON5, so the worker options had unexpect char.
    err(
      'Vite is unable to parse the worker options as the value is not static.' +
        'To ignore this error, please use /* @vite-ignore */ in the worker options.',
      commaIndex + 1
    )
  }

  if (['classic', 'module'].includes(workerOpts.type)) {
    return workerOpts.type
  }
  return 'classic'
}

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  let server: ViteDevServer

  return {
    name: 'vite:worker-import-meta-url',

    configureServer(_server) {
      server = _server
    },

    async transform(code, id, options) {
      const query = parseRequest(id)
      if (query && query[WORKER_FILE_ID] != null && query['type'] != null) {
        const workerType = query['type'] as WorkerType
        let injectEnv = ''

        if (workerType === 'classic') {
          injectEnv = `importScripts('${ENV_PUBLIC_PATH}')\n`
        } else if (workerType === 'module') {
          injectEnv = `import '${ENV_PUBLIC_PATH}'\n`
        } else if (workerType === 'ignore') {
          if (isBuild) {
            injectEnv = ''
          } else if (server) {
            // dynamic worker type we can't know how import the env
            // so we copy /@vite/env code of server transform result into file header
            const { moduleGraph } = server
            const module = moduleGraph.getModuleById(ENV_ENTRY)
            injectEnv = module?.transformResult?.code || ''
          }
        }

        return {
          code: injectEnv + code
        }
      }
      let s: MagicString | undefined
      if (
        (code.includes('new Worker') || code.includes('new SharedWorker')) &&
        code.includes('new URL') &&
        code.includes(`import.meta.url`)
      ) {
        const cleanString = emptyString(code)
        const workerImportMetaUrlRE =
          /\bnew\s+(Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/g

        let match: RegExpExecArray | null
        while ((match = workerImportMetaUrlRE.exec(cleanString))) {
          const { 0: allExp, 2: exp, 3: emptyUrl, index } = match
          const urlIndex = allExp.indexOf(exp) + index

          const urlStart = cleanString.indexOf(emptyUrl, index)
          const urlEnd = urlStart + emptyUrl.length
          const rawUrl = code.slice(urlStart, urlEnd)

          if (options?.ssr) {
            this.error(
              `\`new URL(url, import.meta.url)\` is not supported in SSR.`,
              urlIndex
            )
          }

          // potential dynamic template string
          if (rawUrl[0] === '`' && /\$\{/.test(rawUrl)) {
            this.error(
              `\`new URL(url, import.meta.url)\` is not supported in dynamic template string.`,
              urlIndex
            )
          }

          s ||= new MagicString(code)
          const workerType = getWorkerType(
            code,
            cleanString,
            index + allExp.length
          )
          const file = path.resolve(path.dirname(id), rawUrl.slice(1, -1))
          let url: string
          if (isBuild) {
            url = await workerFileToUrl(this, config, file, query)
          } else {
            url = await fileToUrl(cleanUrl(file), config, this)
            url = injectQuery(url, WORKER_FILE_ID)
            url = injectQuery(url, `type=${workerType}`)
          }
          s.overwrite(urlIndex, urlIndex + exp.length, JSON.stringify(url), {
            contentOnly: true
          })
        }

        if (s) {
          return {
            code: s.toString(),
            map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
          }
        }

        return null
      }
    }
  }
}
