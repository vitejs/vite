import path from 'path'
import { CLIENT_DIR, Plugin, ResolvedConfig, ServerContext } from '..'
import chalk from 'chalk'
import MagicString from 'magic-string'
import { init, parse, ImportSpecifier } from 'es-module-lexer'
import { isCSSRequest } from './css'
import slash from 'slash'
import { createDebugger, prettifyUrl, timeFrom } from '../utils'
import { debugHmr } from '../server/hmr'
import { FILE_PREFIX, CLIENT_PUBLIC_PATH } from '../config'

const isDebug = !!process.env.DEBUG
const debugRewrite = createDebugger('vite:rewrite')

const skipRE = /\.(map|json)$/
const canSkip = (id: string) =>
  id.startsWith(CLIENT_DIR) || skipRE.test(id) || isCSSRequest(id)

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
        this.error(
          `Failed to parse source for import rewrite.\n` +
            `It seems the file has not been properly transformed to JS.\n` +
            `If you are using JSX, make sure to named the file with the .jsx extension.`
        )
      }

      if (!imports.length) {
        isDebug &&
          debugRewrite(
            `${timeFrom(rewriteStart)} ${chalk.dim(
              `[no imports] ${prettyImporter}`
            )}`
          )
        return source
      }

      let hasHMR = false
      let isHMRBoundary = false
      let hasEnv = false
      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))
      // vite-only server context
      const { moduleGraph } = (this as any).serverContext as ServerContext
      // since we are already in the transform phase of the importer, it must
      // have been loaded so its entry is guaranteed in the module graph.
      const importerModule = moduleGraph.getModuleById(importer)!
      const importedUrls = new Set<string>()

      for (const { s: start, e: end, d: dynamicIndex } of imports) {
        let url = source.slice(start, end)

        // check import.meta usage
        if (url === 'import.meta') {
          const prop = source.slice(end, end + 4)
          if (prop === '.hot') {
            hasHMR = true
            if (source.slice(end + 4, end + 11) === '.accept') {
              isHMRBoundary = true
            }
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
            this.warn(
              `failed to resolve import ${chalk.cyan(url)} from ${chalk.yellow(
                importer
              )}.`
            )
            continue
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
          if (isCSSRequest(resolved.id)) {
            str().appendLeft(end, '.js')
          }

          const absoluteUrl = path.posix.resolve(
            path.posix.dirname(importerModule.url),
            url
          )
          // check if the dep has been hmr updated. If yes, we need to attach
          // its last updated timestamp to force the browser to fetch the most
          // up-to-date version of this module.
          const depModule = await moduleGraph.ensureEntry(absoluteUrl)
          if (depModule.lastHMRTimestamp > 0) {
            str().appendLeft(
              end,
              `${url.includes(`?`) ? `&` : `?`}t=${depModule.lastHMRTimestamp}`
            )
          }
          // record for module graph analysis.
          importedUrls.add(absoluteUrl)
        } else if (url !== 'import.meta' && !hasViteIgnore) {
          this.warn(`ignored dynamic import(${url}) in ${importer}.`)
        }
      }

      if (hasEnv) {
        // inject import.meta.env
        str().prepend(`import.meta.env = ${JSON.stringify(config.env)};`)
      }

      if (hasHMR) {
        debugHmr(
          `${
            isHMRBoundary
              ? chalk.green.bold(`[boundary]`)
              : `[detected api usage]`
          } ${prettyImporter}`
        )
        // inject hot context
        str().prepend(
          `import { createHotContext } from "${CLIENT_PUBLIC_PATH}";` +
            `import.meta.hot = createHotContext(${JSON.stringify(
              importerModule.url
            )});`
        )
      }

      // update the module graph for HMR analysis
      await moduleGraph.updateModuleInfo(
        importerModule,
        importedUrls,
        isHMRBoundary
      )

      isDebug &&
        debugRewrite(
          `${timeFrom(rewriteStart, timeSpentResolving)} [${
            importedUrls.size
          } import${
            importedUrls.size > 1 ? `s` : ``
          } resolved in ${timeSpentResolving}ms] ${chalk.dim(
            `${prettyImporter}`
          )}`
        )

      if (s) {
        return s.toString()
      } else {
        return source
      }
    }
  }
}
