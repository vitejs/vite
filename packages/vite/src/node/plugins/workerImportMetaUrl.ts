import * as JSON5 from 'json5'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { getAssetHash, fileToUrl } from './asset'
import {
  cleanUrl,
  injectQuery,
  multilineCommentsRE,
  singlelineCommentsRE
} from '../utils'
import path from 'path'
import { bundleWorkerEntry } from './worker'
import { parseRequest } from '../utils'
import { ENV_ENTRY, ENV_PUBLIC_PATH } from '../constants'
import MagicString from 'magic-string'
import type { ViteDevServer } from '..'

type WorkerType = 'classic' | 'module' | 'ignore'

const WORKER_FILE_ID = 'worker_url_file'

// find the workerOptions end with `)`
function lexWorkerOptions(code: string, pos: number) {
  let pattern = ''
  const opStack = []

  for (let i = pos; i < code.length; i++) {
    const char = code.charAt(i)
    if (char === '(') {
      opStack.push(char)
    } else if (char === ')') {
      if (opStack.length) {
        opStack.pop()
      } else {
        break
      }
    }
    pattern += char
  }

  // had `,` split worker params
  const commaIndex = pattern.indexOf(',')
  if (commaIndex > -1) {
    pattern = pattern.substring(commaIndex + 1)
  }
  return pattern
}

function getWorkerType(code: string, i: number): WorkerType {
  let workerOptsString = lexWorkerOptions(code, i)
  const hasViteIgnore = /\/\*\s*@vite-ignore\s*\*\//.test(workerOptsString)
  if (hasViteIgnore) {
    return 'ignore'
  }

  workerOptsString = workerOptsString
    .replace(multilineCommentsRE, '')
    .replace(singlelineCommentsRE, '')
    .trim()

  if (!workerOptsString.length) {
    return 'classic'
  }

  let workerOpts: { type: WorkerType } = { type: 'classic' }
  try {
    workerOpts = JSON5.parse(workerOptsString)
  } catch (e) {
    // can't parse by JSON5, so the worker options had unexpect char.
    throw new Error(
      'vite worker options type only support static string, ' +
        'if you want to ignore this error, ' +
        'please use /* @vite-ignore */ in the worker options.'
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
      if (
        (code.includes('new Worker') || code.includes('new ShareWorker')) &&
        code.includes('new URL') &&
        code.includes(`import.meta.url`)
      ) {
        const importMetaUrlRE =
          /\bnew\s+(Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/g
        const noCommentsCode = code
          .replace(multilineCommentsRE, (m) => ' '.repeat(m.length))
          .replace(singlelineCommentsRE, (m) => ' '.repeat(m.length))
        let match: RegExpExecArray | null
        let s: MagicString | null = null
        while ((match = importMetaUrlRE.exec(noCommentsCode))) {
          const { 0: allExp, 2: exp, 3: rawUrl, index } = match
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
          const workerType = getWorkerType(code, index + allExp.length)
          const file = path.resolve(path.dirname(id), rawUrl.slice(1, -1))
          let url: string
          if (isBuild) {
            const content = await bundleWorkerEntry(config, file)
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
          s.overwrite(urlIndex, urlIndex + exp.length, JSON.stringify(url))
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
