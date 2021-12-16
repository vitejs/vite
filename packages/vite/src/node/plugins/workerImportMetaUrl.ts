import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import { getAssetHash, fileToUrl } from './asset'
import {
  cleanUrl,
  injectQuery,
  multilineCommentsRE,
  singlelineCommentsRE
} from '../utils'
import { TransformPluginContext } from 'rollup'
import path from 'path'
import { bundleWorkerScript } from './worker'
import { ENV_PUBLIC_PATH } from '../constants'
import MagicString from 'magic-string'
import { parse as parseUrl, URLSearchParams } from 'url'

const WorkerFileId = 'worker_url_file'

interface URLWithImportMetaUrl {
  start: number
  end: number
  workerConstruct: string
  file: string
}

function parseWorkerRequest(id: string): Record<string, string> | null {
  const { search } = parseUrl(id)
  if (!search) {
    return null
  }
  return Object.fromEntries(new URLSearchParams(search.slice(1)))
}

function workerImportMetaUrl(
  ctx: TransformPluginContext,
  code: string,
  id: string,
  options?: { ssr?: boolean }
): URLWithImportMetaUrl[] {
  const result: URLWithImportMetaUrl[] = []
  if (
    code.includes('new Worker') &&
    code.includes('new URL') &&
    code.includes(`import.meta.url`)
  ) {
    const importMetaUrlRE =
      /\bnew\s+[window.|self.]*(Worker|SharedWorker)\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/g
    const noCommentsCode = code
      .replace(multilineCommentsRE, (m) => ' '.repeat(m.length))
      .replace(singlelineCommentsRE, (m) => ' '.repeat(m.length))
    let match: RegExpExecArray | null
    while ((match = importMetaUrlRE.exec(noCommentsCode))) {
      const { 0: allExp, 1: workerConstruct, 2: exp, 3: rawUrl, index } = match
      const urlIndex = allExp.indexOf(exp) + index

      if (options?.ssr) {
        ctx.error(
          `\`new URL(url, import.meta.url)\` is not supported in SSR.`,
          urlIndex
        )
      }

      // potential dynamic template string
      if (rawUrl[0] === '`' && /\$\{/.test(rawUrl)) {
        ctx.error(
          `\`new URL(url, import.meta.url)\` is not supported in dynamic template string.`,
          urlIndex
        )
      }

      const url = rawUrl.slice(1, -1)
      const file = path.resolve(path.dirname(id), url)
      result.push({
        workerConstruct,
        start: urlIndex,
        end: urlIndex + exp.length,
        file
      })
    }
  }
  return result
}

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'

  return {
    name: 'vite:worker-import-meta-url',

    async transform(code, id, options) {
      const query = parseWorkerRequest(id)
      if (query && query[WorkerFileId] != null) {
        return {
          code: `import '${ENV_PUBLIC_PATH}'\n` + code
        }
      }
      const needBundledWorkers = workerImportMetaUrl(this, code, id, options)
      if (needBundledWorkers.length) {
        const s = new MagicString(code)
        await Promise.all(
          needBundledWorkers.map(async ({ file, start, end }) => {
            let url: string
            if (isBuild) {
              const content = await bundleWorkerScript(config, file)
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
              url = injectQuery(url, WorkerFileId)
            }
            s.overwrite(start, end, JSON.stringify(url))
          })
        )
        return s.toString()
      }
    }
  }
}
