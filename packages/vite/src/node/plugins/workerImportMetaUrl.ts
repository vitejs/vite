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
  rawUrl: string
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
      /\bnew\s+[window.|self.]*Worker\s*\(\s*(new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\))/g
    const noCommentsCode = code
      .replace(multilineCommentsRE, (m) => ' '.repeat(m.length))
      .replace(singlelineCommentsRE, (m) => ' '.repeat(m.length))
    let match: RegExpExecArray | null
    while ((match = importMetaUrlRE.exec(noCommentsCode))) {
      const { 0: allexp, 1: exp, 2: rawUrl, index } = match
      const urlIndex = allexp.indexOf(exp) + index

      if (options?.ssr) {
        ctx.error(
          `\`new URL(url, import.meta.url)\` is not supported in SSR.`,
          urlIndex
        )
      }

      // potential dynamic template string
      if (rawUrl[0] === '`' && /\$\{/.test(rawUrl)) {
        ctx.error(
          `\`new Worker(new URL(url, import.meta.url))\` is not supported in dynamic template string.`,
          urlIndex
        )
      }

      const url = rawUrl.slice(1, -1)
      const file = path.resolve(path.dirname(id), url)
      result.push({
        start: urlIndex,
        end: urlIndex + exp.length,
        rawUrl: url,
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
      const needBundedWorkers = workerImportMetaUrl(this, code, id, options)
      if (needBundedWorkers.length) {
        const s = new MagicString(code)
        await Promise.all(
          needBundedWorkers.map(async ({ rawUrl, file, start, end }) => {
            let url: string
            if (isBuild) {
              const workerQuery = parseWorkerRequest(rawUrl)
              const content = await bundleWorkerScript(config, file)
              if  (workerQuery && workerQuery.inline != null) {
                url = `(function  () {
                  const encodedJs = "${content.toString('base64')}";
                  const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
                  const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
                  try {
                    return objURL ? objURL : "data:application/javascript;base64," + encodedJs
                  } finally {
                    // objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
                  }
                })()`
              } else {
                const basename = path.parse(cleanUrl(file)).name
                const contentHash = getAssetHash(content)
                const fileName = path.posix.join(
                  config.build.assetsDir,
                  `${basename}.${contentHash}.js`
                )
                url = JSON.stringify(`__VITE_ASSET__${this.emitFile({
                  fileName,
                  type: 'asset',
                  source: content
                })}__`)
              }
            } else {
              url = await fileToUrl(cleanUrl(file), config, this)
              url = injectQuery(url, WorkerFileId)
              url = JSON.stringify(url)
            }
            s.overwrite(start, end, url)
          })
        )
        return s.toString()
      }
    }
  }
}
