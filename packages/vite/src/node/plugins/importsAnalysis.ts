import path from 'path'
import { Plugin } from '../plugin'
import { ResolvedConfig } from '../config'
import chalk from 'chalk'
import MagicString from 'magic-string'
import { init, parse, ImportSpecifier } from 'es-module-lexer'
import { isCSSProxy, isCSSRequest } from './css'
import slash from 'slash'
import {
  cleanUrl,
  createDebugger,
  injectQuery,
  isJSRequest,
  prettifyUrl,
  timeFrom
} from '../utils'
import { debugHmr, handlePrunedModules } from '../server/hmr'
import { FILE_PREFIX, CLIENT_PUBLIC_PATH } from '../constants'
import { RollupError } from 'rollup'
import { FAILED_RESOLVE } from './resolve'
import { ViteDevServer } from '../'

const isDebug = !!process.env.DEBUG
const debugRewrite = createDebugger('vite:rewrite')

const skipRE = /\.(map|json)$/
const canSkip = (id: string) => skipRE.test(id) || isCSSRequest(id)

/**
 * Server-only plugin that lexes, resolves, rewrites and analyzes url imports.
 *
 * - Imports are resolved to ensure they exist on disk
 *
 * - Lexes HMR accept calls and updates import relationships in the module graph
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
export function importAnalysisPlugin(config: ResolvedConfig): Plugin {
  let server: ViteDevServer

  return {
    name: 'vite:imports',

    configureServer(_server) {
      server = _server
    },

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
            `The file either contains syntax error or it has not been properly transformed to JS.\n` +
            `If you are using JSX, make sure to named the file with the .jsx extension.`,
          e.idx
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
      let isSelfAccepting = false
      let hasEnv = false
      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))
      // vite-only server context
      const { moduleGraph } = server
      // since we are already in the transform phase of the importer, it must
      // have been loaded so its entry is guaranteed in the module graph.
      const importerModule = moduleGraph.getModuleById(importer)!
      const importedUrls = new Set<string>()
      const acceptedUrls = new Set<string>()
      const toAbsoluteUrl = (url: string) =>
        path.posix.resolve(path.posix.dirname(importerModule.url), url)

      for (const { s: start, e: end, d: dynamicIndex } of imports) {
        const rawUrl = source.slice(start, end)
        let url = rawUrl

        // check import.meta usage
        if (url === 'import.meta') {
          const prop = source.slice(end, end + 4)
          if (prop === '.hot') {
            hasHMR = true
            if (source.slice(end + 4, end + 11) === '.accept') {
              // further analyze accepted modules
              if (
                lexAccepted(
                  source,
                  source.indexOf('(', end + 11) + 1,
                  acceptedUrls
                )
              ) {
                isSelfAccepting = true
              }
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

          if (!resolved || resolved.id === FAILED_RESOLVE) {
            this.warn(
              `Failed to resolve import ${chalk.cyan(url)} from ${chalk.yellow(
                importer
              )}.`
            )
            continue
          }

          // if the import is a literal fs path (possibly generated by plugin
          // transforms), try to shorten it down to root-relative so source
          // maps can work properly
          if (url === resolved.id && url.startsWith(config.root)) {
            url = slash(url.slice(config.root.length))
          }

          // bare imports must be rewritten into valid URLs to make them
          // compliant with native browser ESM.
          // e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js`
          if (!url.startsWith('/') && !url.startsWith('./')) {
            // prefix with /@fs/
            url = FILE_PREFIX + slash(resolved.id)
          }

          // ensure extension so we can rely on extension checks in the transform middleware
          const cleanId = cleanUrl(resolved.id)
          const resolvedExt = path.extname(cleanId)
          if (path.extname(cleanUrl(url)) !== resolvedExt) {
            const [pathname, query] = url.split('?')
            url = `${pathname}${resolvedExt}${query ? `?${query}` : ``}`
          }

          // mark non-js imports with `?import`
          if (!isJSRequest(cleanId) || isCSSRequest(url)) {
            url = injectQuery(url, 'import')
          }

          const absoluteUrl = toAbsoluteUrl(url)

          // check if the dep has been hmr updated. If yes, we need to attach
          // its last updated timestamp to force the browser to fetch the most
          // up-to-date version of this module.
          try {
            const depModule = await moduleGraph.ensureEntryFromUrl(absoluteUrl)
            if (depModule.lastHMRTimestamp > 0) {
              url = injectQuery(url, `t=${depModule.lastHMRTimestamp}`)
            }
          } catch (e) {
            // it's possible that the dep fails to resolve (non-existent import)
            // attach location to the missing import
            e.pos = start
            throw e
          }

          // rewrite
          if (url !== rawUrl) {
            str().overwrite(start, end, isLiteralDynamicId ? `'${url}'` : url)
          }

          // record for HMR import chain analysis
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
            isSelfAccepting
              ? `[self-accepts]`
              : acceptedUrls.size
              ? `[accepts-deps]`
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

      // update the module graph for HMR analysis.
      // node CSS imports does its own graph update in the css plugin so we
      // only handle js graph updates here.
      if (!isCSSProxy(importer)) {
        const prunedImports = await moduleGraph.updateModuleInfo(
          importerModule,
          importedUrls,
          new Set([...acceptedUrls].map(toAbsoluteUrl)),
          isSelfAccepting
        )
        if (hasHMR && prunedImports) {
          handlePrunedModules(prunedImports, server)
        }
      }

      isDebug &&
        debugRewrite(
          `${timeFrom(rewriteStart, timeSpentResolving)} ${prettyImporter}`
        )

      if (s) {
        return s.toString()
      } else {
        return source
      }
    }
  }
}

const enum LexerState {
  inCall,
  inSingleQuoteString,
  inDoubleQuoteString,
  inTemplateString,
  inArray
}

/**
 * Lex the accepted HMR deps.
 * Since hot.accept() can only accept string literals or array of string
 * literals, we don't really need a heavy @babel/parse call on the entire source.
 *
 * @returns selfAccepts
 */
function lexAccepted(code: string, start: number, urls: Set<string>): boolean {
  let state: LexerState = LexerState.inCall
  // the state can only be 2 levels deep so no need for a stack
  let prevState: LexerState = LexerState.inCall
  let currentDep: string = ''

  for (let i = start; i < code.length; i++) {
    const char = code.charAt(i)
    switch (state) {
      case LexerState.inCall:
      case LexerState.inArray:
        if (char === `'`) {
          prevState = state
          state = LexerState.inSingleQuoteString
        } else if (char === `"`) {
          prevState = state
          state = LexerState.inDoubleQuoteString
        } else if (char === '`') {
          prevState = state
          state = LexerState.inTemplateString
        } else if (/\s/.test(char)) {
          continue
        } else {
          if (state === LexerState.inCall) {
            if (char === `[`) {
              state = LexerState.inArray
            } else {
              // reaching here means the first arg is neither a string literal
              // nor an Array literal (direct callback) or there is no arg
              // in both case this indicates a self-accepting module
              return true // done
            }
          } else if (state === LexerState.inArray) {
            if (char === `]`) {
              return false // done
            } else if (char === ',') {
              continue
            } else {
              error(i)
            }
          }
        }
        break
      case LexerState.inSingleQuoteString:
        if (char === `'`) {
          urls.add(currentDep)
          currentDep = ''
          state = prevState
        } else {
          currentDep += char
        }
        break
      case LexerState.inDoubleQuoteString:
        if (char === `"`) {
          urls.add(currentDep)
          state = prevState
        } else {
          currentDep += char
        }
        break
      case LexerState.inTemplateString:
        if (char === '`') {
          urls.add(currentDep)
          currentDep = ''
          state = prevState
        } else if (char === '$' && code.charAt(i + 1) === '{') {
          error(i)
        } else {
          currentDep += char
        }
        break
      default:
        throw new Error('unknown lexer state')
    }
  }
  return false
}

function error(pos: number) {
  const err = new Error(
    `import.meta.accept() can only accept string literals or an ` +
      `Array of string literals.`
  ) as RollupError
  err.pos = pos
  throw err
}
