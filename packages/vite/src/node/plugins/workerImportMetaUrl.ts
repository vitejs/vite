import { Plugin } from '../plugin'
import MagicString from 'magic-string'
import path from 'path'
import { getAssetHash } from './asset'
import { ResolvedConfig } from '../config'
import { cleanUrl, multilineCommentsRE, singlelineCommentsRE } from '../utils'
import { bundleWorkerEntry } from './worker'

export function workerImportMetaUrlPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:worker-import-meta-url',
    async transform(sourceCode, id, options) {
      if (
        (sourceCode.includes('new Worker') ||
          sourceCode.includes('new SharedWorker')) &&
        sourceCode.includes('new URL') &&
        sourceCode.includes(`import.meta.url`)
      ) {
        const WORKER_IMPORT_META_URL_RE =
          /\bnew\s*(Worker|ShareWorker)\s*\(\s*new\s+URL\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*,\s*import\.meta\.url\s*\)/g
        const noCommentsCode = sourceCode
          .replace(multilineCommentsRE, (m) => ' '.repeat(m.length))
          .replace(singlelineCommentsRE, (m) => ' '.repeat(m.length))

        let s: MagicString | null = null
        let match: RegExpExecArray | null

        while ((match = WORKER_IMPORT_META_URL_RE.exec(noCommentsCode))) {
          const { 0: exp, 1: workerConstructor, 2: rawUrl, index } = match

          if (options?.ssr) {
            this.error(
              `\`new URL(url, import.meta.url)\` is not supported in SSR.`,
              index
            )
          }

          if (!s) s = new MagicString(sourceCode)

          // TODO
          // potential dynamic template string
          if (rawUrl[0] === '`' && /\$\{/.test(rawUrl)) {
            // const ast = this.parse(rawUrl)
            // const templateLiteral = (ast as any).body[0].expression
            // if (templateLiteral.expressions.length) {
            //   const pattern = buildGlobPattern(templateLiteral)
            //   // Note: native import.meta.url is not supported in the baseline
            //   // target so we use the global location here. It can be
            //   // window.location or self.location in case it is used in a Web Worker.
            //   // @see https://developer.mozilla.org/en-US/docs/Web/API/Window/self
            //   s.overwrite(
            //     index,
            //     index + exp.length,
            //     `new URL(import.meta.globEagerDefault(${JSON.stringify(
            //       pattern
            //     )})[${rawUrl}], self.location)`
            //   )
            //   continue
            // }
          }

          const stripUrl = rawUrl.slice(1, -1)
          const file = path.resolve(path.dirname(id), stripUrl)
          const { code, content } = await bundleWorkerEntry(file, config)
          let url: string
          if (
            config.build.lib ||
            code.length < Number(config.build.assetsInlineLimit)
          ) {
            // base64 inlined as a string
            url = `data:application/javascript;base64,${content.toString(
              'base64'
            )}`
          } else {
            const basename = path.parse(file).name
            const contentHash = getAssetHash(content)
            const fileName = path.posix.join(
              config.build.assetsDir,
              `${basename}.${contentHash}.js`
            )
            url = `__VITE_ASSET__${this.emitFile({
              fileName,
              type: 'asset',
              source: code
            })}__`
          }

          s.overwrite(
            index,
            index + exp.length,
            `new ${workerConstructor}(new URL(${JSON.stringify(
              url
            )}, self.location)`
          )
        }
        if (s) {
          return {
            code: s.toString(),
            map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
          }
        }
      }

      return null
    }
  }
}
