import { ResolvedConfig } from '../config'
import { Plugin } from '../plugin'
import { getAssetHash } from './asset'
import { cleanUrl } from '../utils'
import { TransformPluginContext } from 'rollup'
import path from 'path'
import { bundleWorkerScript } from './worker'
import { multilineCommentsRE, singlelineCommentsRE } from '../utils'
import MagicString from 'magic-string'

interface URLWithImportMetaUrl {
  start: number
  end: number
  file: string
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
          `\`new URL(url, import.meta.url)\` is not supported in dynamic template string.`,
          urlIndex
        )
      }

      const url = rawUrl.slice(1, -1)
      const file = path.resolve(path.dirname(id), url)
      result.push({
        start: urlIndex,
        end: urlIndex + exp.length,
        file
      })
    }
  }
  return result
}

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:worker-import-meta-url',

    async transform(code, id, options) {
      const needBundedWorkers = workerImportMetaUrl(this, code, id, options)
      if (needBundedWorkers.length) {
        const s = new MagicString(code)
        await Promise.all(
          needBundedWorkers.map(async ({ file, start, end }) => {
            const content = await bundleWorkerScript(config, file)
            const basename = path.parse(cleanUrl(file)).name
            const contentHash = getAssetHash(content)
            const fileName = path.posix.join(
              config.build.assetsDir,
              `${basename}.${contentHash}.js`
            )
            const url = `__VITE_ASSET__${this.emitFile({
              fileName,
              type: 'asset',
              source: content
            })}__`
            s.overwrite(start, end, JSON.stringify(url))
          })
        )
        return s.toString()
      }
    }
  }
}
