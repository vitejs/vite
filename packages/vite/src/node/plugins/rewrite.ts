import _debug from 'debug'
import { Plugin, ResolvedConfig, ServerContext } from '..'
import chalk from 'chalk'
import { FILE_PREFIX } from './resolve'
import MagicString from 'magic-string'
import { init, parse, ImportSpecifier } from 'es-module-lexer'
import { isCSSRequest } from './css'
import slash from 'slash'
import { prettifyUrl, timeFrom } from '../utils'
import {
  debugHmr,
  updateModuleGraph,
  HMR_CLIENT_PATH
} from '../server/middlewares/hmr'

const isDebug = !!process.env.DEBUG
const debugRewrite = _debug('vite:rewrite')
const debugResolve = _debug('vite:resolve')

const skipRE = /\.(map|json)$/
const canSkip = (id: string) =>
  skipRE.test(id) || isCSSRequest(id) || isCSSRequest(id.slice(0, -3))

/**
 * Server-only plugin that rewrites url imports (bare modules, css/asset imports)
 * so that they can be properly handled by the server.
 *
 * - Bare module imports are resolved (by @rollup-plugin/node-resolve) to
 * absolute file paths, e.g.
 *
 *     ```js
 *     import 'foo'
 *     ```
 *     is rewritten to
 *     ```js
 *     import '/@fs//project/node_modules/foo/dist/foo.js'
 *     ```
 *
 * - CSS imports are appended with `.js` since both the js module and the actual
 * css (referenced via <link>) may go through the trasnform pipeline:
 *
 *     ```js
 *     import './style.css'
 *     ```
 *     is rewritten to
 *     ```js
 *     import './style.css.js'
 *     ```
 */
export function rewritePlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:rewrite',
    async transform(source, importer) {
      const prettyImporter = prettifyUrl(slash(importer), config.root)

      if (canSkip(importer)) {
        isDebug && debugRewrite(chalk.dim(`[skipped] ${prettyImporter}`))
        return null
      }

      const rewriteStart = Date.now()
      let timeSpentResolving = 0
      await init
      let imports: ImportSpecifier[] = []
      try {
        imports = parse(source)[0]
      } catch (e) {
        console.warn(
          chalk.yellow(
            `[vite] failed to parse ${chalk.cyan(
              importer
            )} for import rewrite.\nIf you are using ` +
              `JSX, make sure to named the file with the .jsx extension.`
          )
        )
        return source
      }

      if (!imports.length) {
        isDebug && debugRewrite(chalk.dim(`[no imports] ${prettyImporter}`))
        return source
      }

      let hasHMR = false
      let hasEnv = false
      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))
      const importedUrls = new Set<string>()

      for (const { s: start, e: end, d: dynamicIndex } of imports) {
        let url = source.slice(start, end)

        // check import.meta usage
        if (url === 'import.meta') {
          const prop = source.slice(end, end + 4)
          if (prop === '.hot') {
            hasHMR = true
          } else if (prop === '.env') {
            hasEnv = true
          }
        }

        // For dynamic id, check if it's a literal that we can resolve
        let hasViteIgnore = false
        let isLiteralDynamicId = false
        if (dynamicIndex >= 0) {
          // check @vite-ignore which suppresses dynamic import warning
          hasViteIgnore = /\/\*\s*@vite-ignore\s*\*\//.test(url)
          // #998 remove comment
          url = url.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')
          const literalIdMatch = url.match(/^\s*(?:'([^']+)'|"([^"]+)")\s*$/)
          if (literalIdMatch) {
            isLiteralDynamicId = true
            url = literalIdMatch[1] || literalIdMatch[2]
          }
        }

        // If resolvable, let's resolve it
        if (dynamicIndex === -1 || isLiteralDynamicId) {
          const resolveStart = Date.now()
          const resolved = await this.resolve(url, importer)
          timeSpentResolving += Date.now() - resolveStart

          if (!resolved || !resolved.id) {
            console.warn(
              chalk.yellow(
                `[vite] failed to resolve import ${chalk.cyan(
                  url
                )} from ${chalk.yellow(importer)}.`
              )
            )
            continue
          }

          if (isDebug && url !== resolved.id) {
            debugResolve(
              `${timeFrom(resolveStart)} ${chalk.cyan(url)} -> ${chalk.dim(
                resolved.id
              )}`
            )
          }

          // bare imports must be rewritten into valid URLs to make them
          // compliant with native browser ESM.
          // e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js`
          if (!url.startsWith('/') && !url.startsWith('./')) {
            // prefix with /@fs/
            url = FILE_PREFIX + slash(resolved.id)
            str().overwrite(start, end, isLiteralDynamicId ? `'${url}'` : url)
          }

          // resolve CSS imports into js (so it differentiates from actual
          // CSS references from <link>)
          if (isCSSRequest(url)) {
            str().appendLeft(end, '.js')
          }

          // record for module graph analysis.
          importedUrls.add(url)
        } else if (url !== 'import.meta' && !hasViteIgnore) {
          console.warn(
            chalk.yellow(
              `[vite] ignored dynamic import(${url}) in ${importer}.`
            )
          )
        }
      }

      // vite-only server context
      const serverContext = (this as any).serverContext as ServerContext
      // since we are already in the transform phase of the importer, it must
      // have been resolved so its entry is guaranteed in the fileToUrlMap.
      const importerUrl = serverContext.fileToUrlMap.get(importer)!
      // update the module graph for HMR analysis
      updateModuleGraph(importerUrl, importedUrls, hasHMR)

      if (hasHMR) {
        debugHmr(`${chalk.green(`[enabled]`)} ${prettyImporter}`)
        // inject hot context
        str().prepend(
          `import { createHotContext } from "${HMR_CLIENT_PATH}";` +
            `import.meta.hot = createHotContext(${JSON.stringify(
              importerUrl
            )});`
        )
      }

      if (hasEnv) {
        // inject import.meta.env
        str().prepend(`import.meta.env = ${JSON.stringify(config.env)};`)
      }

      const result = s ? s.toString() : source
      isDebug &&
        debugRewrite(
          `${timeFrom(rewriteStart, timeSpentResolving)} ${chalk.dim(
            prettyImporter
          )}`
        )
      return result
    }
  }
}
