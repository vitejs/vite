import JSON5 from 'json5'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { getAssetHash, fileToUrl } from './asset'
import {
  blankReplacer,
  cleanUrl,
  injectQuery,
  multilineCommentsRE,
  singlelineCommentsRE
} from '../utils'
import path from 'path'
import { bundleWorkerEntry } from './worker'
import { parseRequest } from '../utils'
import { ENV_ENTRY, ENV_PUBLIC_PATH, JS_TYPES_RE } from '../constants'
import MagicString from 'magic-string'
import type { ViteDevServer } from '..'
import type { RollupError } from 'rollup'
import { htmlTypesRE, scriptRE } from '../optimizer/scan'

type WorkerType = 'classic' | 'module' | 'ignore'

const WORKER_FILE_ID = 'worker_url_file'

const importMetaUrlRE =
  /\bnew\s+(Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/g

function getWorkerType(
  code: string,
  noCommentsCode: string,
  i: number
): WorkerType {
  function err(e: string, pos: number) {
    const error = new Error(e) as RollupError
    error.pos = pos
    throw error
  }

  const commaIndex = noCommentsCode.indexOf(',', i)
  if (commaIndex === -1) {
    return 'classic'
  }
  const endIndex = noCommentsCode.indexOf(')', i)

  // case: ') ... ,' mean no worker options params
  if (commaIndex > endIndex) {
    return 'classic'
  }

  // need to find in comment code
  let workerOptsString = code.substring(commaIndex + 1, endIndex)

  const hasViteIgnore = /\/\*\s*@vite-ignore\s*\*\//.test(workerOptsString)
  if (hasViteIgnore) {
    return 'ignore'
  }

  // need to find in no comment code
  workerOptsString = noCommentsCode.substring(commaIndex + 1, endIndex)
  if (!workerOptsString.trim().length) {
    return 'classic'
  }

  let workerOpts: { type: WorkerType } = { type: 'classic' }
  try {
    workerOpts = JSON5.parse(workerOptsString)
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
      // format worker
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

      // transfrom code
      let inHTML = false
      if (htmlTypesRE.test(id)) {
        inHTML = true
      } else if (JS_TYPES_RE.test(id)) {
        inHTML = false
      } else {
        return
      }

      if (
        !(code.includes('new Worker') || code.includes('new ShareWorker')) ||
        !code.includes('new URL') ||
        !code.includes(`import.meta.url`)
      ) {
        return
      }

      let match: RegExpExecArray | null
      let s: MagicString | undefined

      const transformWorkerImportMetaUrl = async (
        content: string,
        start: number
      ) => {
        const noCommentsCode = content
          .replace(multilineCommentsRE, blankReplacer)
          .replace(singlelineCommentsRE, blankReplacer)

        while ((match = importMetaUrlRE.exec(noCommentsCode))) {
          const { 0: allExp, 2: exp, 3: rawUrl, index: matchIndex } = match
          const index = start + matchIndex
          const urlIndex = allExp.indexOf(exp) + index

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
            content,
            noCommentsCode,
            matchIndex + allExp.length
          )
          const file = path.resolve(path.dirname(id), rawUrl.slice(1, -1))
          let url: string
          if (isBuild) {
            const content = await bundleWorkerEntry(this, config, file)
            const basename = path.parse(cleanUrl(file)).name
            const contentHash = getAssetHash(content)
            const fileName = path.posix.join(
              config.build.assetsDir,
              `${basename}.${contentHash}.js`
            )
            url = `__VITE_ASSET__${this.emitFile({
              fileName,
              type: 'asset',
              source: content
            })}__`
          } else {
            url = await fileToUrl(cleanUrl(file), config, this)
            url = injectQuery(url, WORKER_FILE_ID)
            url = injectQuery(url, `type=${workerType}`)
          }
          s.overwrite(urlIndex, urlIndex + exp.length, JSON.stringify(url), {
            contentOnly: true
          })
        }
      }

      if (inHTML) {
        let scriptMatch: RegExpExecArray | null = null
        while ((scriptMatch = scriptRE.exec(code))) {
          const { 0: exp, 2: script, index: scriptMatchIndex } = scriptMatch
          const index = exp.indexOf(script) + scriptMatchIndex

          await transformWorkerImportMetaUrl(script, index)
        }
      } else {
        await transformWorkerImportMetaUrl(code, 0)
      }

      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
        }
      }
    }
  }
}
