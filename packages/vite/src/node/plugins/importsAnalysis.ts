import fs from 'fs'
import path from 'path'
import { Plugin } from '../plugin'
import { ResolvedConfig } from '../config'
import chalk from 'chalk'
import MagicString from 'magic-string'
import { init, parse as parseImports, ImportSpecifier } from 'es-module-lexer'
import { isCSSRequest, isDirectCSSRequest } from './css'
import {
  cleanUrl,
  createDebugger,
  generateCodeFrame,
  injectQuery,
  isDataUrl,
  isExternalUrl,
  isJSRequest,
  normalizePath,
  prettifyUrl,
  timeFrom
} from '../utils'
import {
  debugHmr,
  handlePrunedModules,
  lexAcceptedHmrDeps
} from '../server/hmr'
import {
  FS_PREFIX,
  CLIENT_PUBLIC_PATH,
  DEP_VERSION_RE,
  VALID_ID_PREFIX
} from '../constants'
import { ViteDevServer } from '../'
import { checkPublicFile } from './asset'
import { parse as parseJS } from 'acorn'
import { ImportDeclaration } from 'estree'
import { makeLegalIdentifier } from '@rollup/pluginutils'

const isDebug = !!process.env.DEBUG
const debugRewrite = createDebugger('vite:rewrite')

const skipRE = /\.(map|json)$/
const canSkip = (id: string) => skipRE.test(id) || isDirectCSSRequest(id)

function markExplicitImport(url: string) {
  if (!isJSRequest(cleanUrl(url)) && !isCSSRequest(url)) {
    return injectQuery(url, 'import')
  }
  return url
}

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
      const prettyImporter = prettifyUrl(normalizePath(importer), config.root)

      if (canSkip(importer)) {
        isDebug && debugRewrite(chalk.dim(`[skipped] ${prettyImporter}`))
        return null
      }

      const rewriteStart = Date.now()
      let timeSpentResolving = 0
      await init
      let imports: ImportSpecifier[] = []
      try {
        imports = parseImports(source)[0]
      } catch (e) {
        const isVue = importer.endsWith('.vue')
        const maybeJSX = !isVue && isJSRequest(importer)

        const msg = isVue
          ? `Install @vitejs/plugin-vue to handle .vue files.`
          : maybeJSX
          ? `If you are using JSX, make sure to name the file with the .jsx or .tsx extension.`
          : `You may need to install appropriate plugins to handle the ${path.extname(
              importer
            )} file format.`

        this.error(
          `Failed to parse source for import analysis because the content ` +
            `contains invalid JS syntax. ` +
            msg,
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
      const acceptedUrls = new Set<{
        url: string
        start: number
        end: number
      }>()
      const toAbsoluteUrl = (url: string) =>
        path.posix.resolve(path.posix.dirname(importerModule.url), url)

      for (let i = 0; i < imports.length; i++) {
        const {
          s: start,
          e: end,
          ss: expStart,
          se: expEnd,
          d: dynamicIndex
        } = imports[i]

        const rawUrl = source.slice(start, end)
        let url = rawUrl

        if (isExternalUrl(url) || isDataUrl(url)) {
          continue
        }

        // check import.meta usage
        if (url === 'import.meta') {
          const prop = source.slice(end, end + 4)
          if (prop === '.hot') {
            hasHMR = true
            if (source.slice(end + 4, end + 11) === '.accept') {
              // further analyze accepted modules
              if (
                lexAcceptedHmrDeps(
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
          continue
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
          // skip client
          if (url === CLIENT_PUBLIC_PATH) {
            continue
          }

          // warn imports to non-asset /public files
          if (
            url.startsWith('/') &&
            !config.assetsInclude(cleanUrl(url)) &&
            checkPublicFile(url, config.root)
          ) {
            throw new Error(
              `Cannot import non-asset file ${url} which is inside /public.` +
                `JS/CSS files inside /public are copied as-is on build and ` +
                `can only be referenced via <script src> or <link href> in html.`
            )
          }

          const resolveStart = Date.now()
          const resolved = await this.resolve(url, importer)

          if (!resolved) {
            this.error(
              `Failed to resolve import "${rawUrl}". Does the file exist?`,
              start
            )
          }

          timeSpentResolving += Date.now() - resolveStart

          const isRelative = url.startsWith('.')

          // normalize all imports into resolved URLs
          // e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js`
          if (url !== resolved.id) {
            if (resolved.id.startsWith(config.root)) {
              // in root: infer short absolute path from root
              url = resolved.id.slice(config.root.length)
            } else if (fs.existsSync(cleanUrl(resolved.id))) {
              // exists but out of root: rewrite to absolute /@fs/ paths
              url = FS_PREFIX + normalizePath(resolved.id)
            } else {
              url = resolved.id
            }
          }

          // if the resolved id is not a valid browser import specifier,
          // prefix it to make it valid. We will strip this before feeding it
          // back into the transform pipeline
          if (!url.startsWith('.') && !url.startsWith('/')) {
            url = VALID_ID_PREFIX + resolved.id
          }

          // mark non-js/css imports with `?import`
          url = markExplicitImport(url)

          // for relative js/css imports, inherit importer's version query
          // do not do this for unknown type imports, otherwise the appended
          // query can break 3rd party plugin's extension checks.
          if (isRelative && !/[\?&]import\b/.test(url)) {
            const versionMatch = importer.match(DEP_VERSION_RE)
            if (versionMatch) {
              url = injectQuery(url, versionMatch[1])
            }
          }

          // check if the dep has been hmr updated. If yes, we need to attach
          // its last updated timestamp to force the browser to fetch the most
          // up-to-date version of this module.
          try {
            const depModule = await moduleGraph.ensureEntryFromUrl(url)
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
            // for optimized cjs deps, support named imports by rewriting named
            // imports to const assignments.
            if (isOptimizedCjs(resolved.id, server)) {
              if (isLiteralDynamicId) {
                // rewrite `import('package')` to expose module.exports
                // note plugin-commonjs' behavior is exposing all properties on
                // `module.exports` PLUS `module.exports` itself as `default`.
                str().overwrite(
                  dynamicIndex,
                  end + 1,
                  `import('${url}').then(m => ({ ...m.default, default: m.default }))`
                )
              } else {
                const exp = source.slice(expStart, expEnd)
                str().overwrite(
                  expStart,
                  expEnd,
                  transformCjsImport(exp, url, rawUrl, i)
                )
              }
            } else {
              str().overwrite(start, end, isLiteralDynamicId ? `'${url}'` : url)
            }
          }

          // record for HMR import chain analysis
          importedUrls.add(url)
        } else if (!hasViteIgnore && !isSupportedDynamicImport(url)) {
          this.warn(
            `\n` +
              chalk.cyan(importerModule.file) +
              `\n` +
              generateCodeFrame(source, start) +
              `\nThe above dynamic import cannot be analyzed by vite.\n` +
              `See ${chalk.blue(
                `https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations`
              )} ` +
              `for supported dynamic import formats. ` +
              `If this is intended to be left as-is, you can use the ` +
              `/* @vite-ignore */ comment inside the import() call to suppress this warning.\n`
          )
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

      // normalize and rewrite accepted urls
      const normalizedAcceptedUrls = new Set<string>()
      for (const { url, start, end } of acceptedUrls) {
        const [normalized] = await moduleGraph.resolveUrl(
          toAbsoluteUrl(markExplicitImport(url))
        )
        normalizedAcceptedUrls.add(normalized)
        str().overwrite(start, end, JSON.stringify(normalized))
      }

      // update the module graph for HMR analysis.
      // node CSS imports does its own graph update in the css plugin so we
      // only handle js graph updates here.
      if (!isCSSRequest(importer)) {
        const prunedImports = await moduleGraph.updateModuleInfo(
          importerModule,
          importedUrls,
          normalizedAcceptedUrls,
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

/**
 * https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
 * This is probably less accurate but is much cheaper than a full AST parse.
 */
function isSupportedDynamicImport(url: string) {
  url = url.trim().slice(1, -1)
  // must be relative
  if (!url.startsWith('./') && !url.startsWith('../')) {
    return false
  }
  // must have extension
  if (!path.extname(url)) {
    return false
  }
  // must be more specific if importing from same dir
  if (url.startsWith('./${') && url.indexOf('/') === url.lastIndexOf('/')) {
    return false
  }
  return true
}

function isOptimizedCjs(
  id: string,
  { optimizeDepsMetadata, config: { optimizeCacheDir } }: ViteDevServer
): boolean {
  if (optimizeDepsMetadata && optimizeCacheDir) {
    const relative = path.relative(optimizeCacheDir, cleanUrl(id))
    return relative in optimizeDepsMetadata.cjsEntries
  }
  return false
}

type ImportNameSpecifier = { importedName: string; localName: string }

/**
 * Detect import statements to a known optimized CJS dependency and provide
 * ES named imports interop. We do this by rewriting named imports to a variable
 * assignment to the corresponding property on the `module.exports` of the cjs
 * module. Note this doesn't support dynamic re-assisgnments from within the cjs
 * module.
 *
 * Credits \@csr632 via #837
 */
function transformCjsImport(
  importExp: string,
  url: string,
  rawUrl: string,
  importIndex: number
): string {
  const ast = (parseJS(importExp, {
    ecmaVersion: 2020,
    sourceType: 'module'
  }) as any).body[0] as ImportDeclaration

  const importNames: ImportNameSpecifier[] = []

  ast.specifiers.forEach((obj) => {
    if (obj.type === 'ImportSpecifier' && obj.imported.type === 'Identifier') {
      const importedName = obj.imported.name
      const localName = obj.local.name
      importNames.push({ importedName, localName })
    } else if (obj.type === 'ImportDefaultSpecifier') {
      importNames.push({ importedName: 'default', localName: obj.local.name })
    } else if (obj.type === 'ImportNamespaceSpecifier') {
      importNames.push({ importedName: '*', localName: obj.local.name })
    }
  })

  // If there is multiple import for same id in one file,
  // importIndex will prevent the cjsModuleName to be duplicate
  const cjsModuleName = makeLegalIdentifier(
    `$viteCjsImport${importIndex}_${rawUrl}`
  )
  const lines: string[] = [`import ${cjsModuleName} from "${url}";`]
  importNames.forEach(({ importedName, localName }) => {
    if (importedName === '*' || importedName === 'default') {
      lines.push(`const ${localName} = ${cjsModuleName};`)
    } else {
      lines.push(`const ${localName} = ${cjsModuleName}["${importedName}"];`)
    }
  })
  return lines.join('\n')
}
