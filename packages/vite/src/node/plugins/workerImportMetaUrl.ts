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
import { ENV_PUBLIC_PATH } from '../constants'
import MagicString from 'magic-string'

const WORKER_FILE_ID = 'worker_url_file'

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'

  return {
    name: 'vite:worker-import-meta-url',

    async transform(code, id, options) {
      const query = parseRequest(id)
      if (query && query[WORKER_FILE_ID] != null) {
        return {
          code: `import '${ENV_PUBLIC_PATH}'\n` + code
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
