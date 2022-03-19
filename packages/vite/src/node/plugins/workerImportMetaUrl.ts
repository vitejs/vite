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
import { bundleWorkerEntry, inlineWorkerLoader } from './worker'
import { parseRequest } from '../utils'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import MagicString from 'magic-string'
import type { ViteDevServer } from '..'

type WorkerType = 'classic' | 'module' | 'ignore'

interface ResolveWorkerOptions {
  workerType: WorkerType
  optionEnd: number
  option: string
}

const WORKER_FILE_ID = 'worker_url_file'

function analyzeWorkerOptions(
  code: string,
  noCommentsCode: string,
  i: number
): ResolveWorkerOptions {
  const commaIndex = noCommentsCode.indexOf(',', i)
  let endIndex = noCommentsCode.indexOf(')', i)
  let closeIndex = noCommentsCode.indexOf('(', i)

  // ensure no `(` before the `)`
  while (closeIndex !== -1 && endIndex !== -1 && closeIndex < endIndex) {
    endIndex = noCommentsCode.indexOf(')', endIndex + 1)
    closeIndex = noCommentsCode.indexOf('(', endIndex + 1)
  }

  if (endIndex === -1) {
    throw new Error(`can't resolve worker options`)
  }

  const noCommentWorkerOptsStr = noCommentsCode.substring(
    commaIndex + 1,
    endIndex
  )

  const resolveWorkerOptions: ResolveWorkerOptions = {
    workerType: 'classic',
    optionEnd: endIndex,
    option: noCommentWorkerOptsStr
  }

  if (commaIndex === -1) {
    return resolveWorkerOptions
  }

  const workerOptsString = code.substring(commaIndex + 1, endIndex)
  // need to find in comment code
  const hasViteIgnore = /\/\*\s*@vite-ignore\s*\*\//.test(workerOptsString)
  if (hasViteIgnore) {
    resolveWorkerOptions.workerType = 'ignore'
    return resolveWorkerOptions
  }

  // need to find in no comment code
  if (!noCommentWorkerOptsStr.trim().length) {
    resolveWorkerOptions.workerType = 'classic'
    return resolveWorkerOptions
  }

  let workerOpts: { type: WorkerType } = { type: 'classic' }
  try {
    workerOpts = JSON5.parse(noCommentWorkerOptsStr)
  } catch (e) {
    // can't parse by JSON5, so the worker options had unexpect char.
    throw new Error(
      'Vite is unable to parse the worker options as the value is not static.' +
        'To ignore this error, please use /* @vite-ignore */ in the worker options.'
    )
  }

  if (['classic', 'module'].includes(workerOpts.type)) {
    resolveWorkerOptions.workerType = workerOpts.type
    return resolveWorkerOptions
  }
  return resolveWorkerOptions
}

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  const { inlineLimit } = config.worker
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
      if (
        (code.includes('new Worker') || code.includes('new ShareWorker')) &&
        code.includes('new URL') &&
        code.includes(`import.meta.url`)
      ) {
        const importMetaUrlRE =
          /\bnew\s+(Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/g
        const noCommentsCode = code
          .replace(multilineCommentsRE, blankReplacer)
          .replace(singlelineCommentsRE, blankReplacer)
        let match: RegExpExecArray | null
        let s: MagicString | null = null
        while ((match = importMetaUrlRE.exec(noCommentsCode))) {
          const {
            0: allExp,
            1: workerConstructor,
            2: exp,
            3: rawUrl,
            index
          } = match
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
          const { workerType, optionEnd, option } = analyzeWorkerOptions(
            code,
            noCommentsCode,
            index + allExp.length
          )
          const file = path.resolve(path.dirname(id), rawUrl.slice(1, -1))
          let url: string
          if (isBuild) {
            const content = await bundleWorkerEntry(this, config, file)
            const inline = code.length < inlineLimit

            if (inline) {
              const workerOption = option.replace(/\s/g, '') || '{}'
              // inline as blob data url
              const inlineWorker = `(${inlineWorkerLoader.toString()})(${workerConstructor}, ${workerOption}, "${content.toString(
                'base64'
              )}")`
              s.overwrite(index, optionEnd + 1, inlineWorker)
            } else {
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
              s.overwrite(urlIndex, urlIndex + exp.length, JSON.stringify(url))
            }
          } else {
            url = await fileToUrl(cleanUrl(file), config, this)
            url = injectQuery(url, WORKER_FILE_ID)
            url = injectQuery(url, `type=${workerType}`)
            s.overwrite(urlIndex, urlIndex + exp.length, JSON.stringify(url))
          }
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
