import fs from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'
import colors from 'picocolors'
import MagicString from 'magic-string'
import type { ImportSpecifier } from 'es-module-lexer'
import { init, parse as parseImports } from 'es-module-lexer'
import { parse as parseJS } from 'acorn'
import type { Node } from 'estree'
import { makeLegalIdentifier } from '@rollup/pluginutils'
import type { ViteDevServer } from '..'
import {
  CLIENT_DIR,
  CLIENT_PUBLIC_PATH,
  DEP_VERSION_RE,
  FS_PREFIX,
  NULL_BYTE_PLACEHOLDER,
  VALID_ID_PREFIX
} from '../constants'
import {
  debugHmr,
  handlePrunedModules,
  lexAcceptedHmrDeps
} from '../server/hmr'
import {
  cleanUrl,
  createDebugger,
  fsPathFromUrl,
  generateCodeFrame,
  injectQuery,
  isBuiltin,
  isDataUrl,
  isExternalUrl,
  isJSRequest,
  moduleListContains,
  normalizePath,
  prettifyUrl,
  removeImportQuery,
  timeFrom,
  transformResult,
  unwrapId
} from '../utils'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import {
  cjsShouldExternalizeForSSR,
  shouldExternalizeForSSR
} from '../ssr/ssrExternal'
import { transformRequest } from '../server/transformRequest'
import {
  getDepsCacheDir,
  getDepsOptimizer,
  optimizedDepNeedsInterop
} from '../optimizer'
import { checkPublicFile } from './asset'
import {
  ERR_OUTDATED_OPTIMIZED_DEP,
  delayDepsOptimizerUntil
} from './optimizedDeps'
import { isCSSRequest, isDirectCSSRequest } from './css'
import { browserExternalId } from './resolve'

const isDebug = !!process.env.DEBUG
const debug = createDebugger('vite:import-analysis')

const clientDir = normalizePath(CLIENT_DIR)

const skipRE = /\.(map|json)$/
export const canSkipImportAnalysis = (id: string): boolean =>
  skipRE.test(id) || isDirectCSSRequest(id)

const optimizedDepChunkRE = /\/chunk-[A-Z0-9]{8}\.js/
const optimizedDepDynamicRE = /-[A-Z0-9]{8}\.js/

function isExplicitImportRequired(url: string) {
  return !isJSRequest(cleanUrl(url)) && !isCSSRequest(url)
}

function markExplicitImport(url: string) {
  if (isExplicitImportRequired(url)) {
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
 * css (referenced via <link>) may go through the transform pipeline:
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
  const { root, base } = config
  const clientPublicPath = path.posix.join(base, CLIENT_PUBLIC_PATH)
  let server: ViteDevServer

  return {
    name: 'vite:import-analysis',

    configureServer(_server) {
      server = _server
    },

    async transform(source, importer, options) {
      // In a real app `server` is always defined, but it is undefined when
      // running src/node/server/__tests__/pluginContainer.spec.ts
      if (!server) {
        return null
      }

      const ssr = options?.ssr === true
      const prettyImporter = prettifyUrl(importer, root)

      if (canSkipImportAnalysis(importer)) {
        isDebug && debug(colors.dim(`[skipped] ${prettyImporter}`))
        return null
      }

      const start = performance.now()
      await init
      let imports: readonly ImportSpecifier[] = []
      // strip UTF-8 BOM
      if (source.charCodeAt(0) === 0xfeff) {
        source = source.slice(1)
      }
      try {
        imports = parseImports(source)[0]
      } catch (e: any) {
        const isVue = importer.endsWith('.vue')
        const maybeJSX = !isVue && isJSRequest(importer)

        const msg = isVue
          ? `Install @vitejs/plugin-vue to handle .vue files.`
          : maybeJSX
          ? `If you are using JSX, make sure to name the file with the .jsx or .tsx extension.`
          : `You may need to install appropriate plugins to handle the ${path.extname(
              importer
            )} file format, or if it's an asset, add "**/*${path.extname(
              importer
            )}" to \`assetsInclude\` in your configuration.`

        this.error(
          `Failed to parse source for import analysis because the content ` +
            `contains invalid JS syntax. ` +
            msg,
          e.idx
        )
      }

      const { moduleGraph } = server
      // since we are already in the transform phase of the importer, it must
      // have been loaded so its entry is guaranteed in the module graph.
      const importerModule = moduleGraph.getModuleById(importer)!

      if (!imports.length) {
        importerModule.isSelfAccepting = false
        isDebug &&
          debug(
            `${timeFrom(start)} ${colors.dim(`[no imports] ${prettyImporter}`)}`
          )
        return source
      }

      let hasHMR = false
      let isSelfAccepting = false
      let hasEnv = false
      let needQueryInjectHelper = false
      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))
      const importedUrls = new Set<string>()
      const staticImportedUrls = new Set<{ url: string; id: string }>()
      const acceptedUrls = new Set<{
        url: string
        start: number
        end: number
      }>()
      const toAbsoluteUrl = (url: string) =>
        path.posix.resolve(path.posix.dirname(importerModule.url), url)

      const depsOptimizer = getDepsOptimizer(config)

      const normalizeUrl = async (
        url: string,
        pos: number
      ): Promise<[string, string]> => {
        if (base !== '/' && url.startsWith(base)) {
          url = url.replace(base, '/')
        }

        let importerFile = importer
        if (moduleListContains(config.optimizeDeps?.exclude, url)) {
          if (depsOptimizer) {
            await depsOptimizer.scanProcessing

            // if the dependency encountered in the optimized file was excluded from the optimization
            // the dependency needs to be resolved starting from the original source location of the optimized file
            // because starting from node_modules/.vite will not find the dependency if it was not hoisted
            // (that is, if it is under node_modules directory in the package source of the optimized file)
            for (const optimizedModule of depsOptimizer.metadata.depInfoList) {
              if (!optimizedModule.src) continue // Ignore chunks
              if (optimizedModule.file === importerModule.file) {
                importerFile = optimizedModule.src
              }
            }
          }
        }

        const resolved = await this.resolve(url, importerFile)

        if (!resolved) {
          // in ssr, we should let node handle the missing modules
          if (ssr) {
            return [url, url]
          }
          this.error(
            `Failed to resolve import "${url}" from "${path.relative(
              process.cwd(),
              importerFile
            )}". Does the file exist?`,
            pos
          )
        }

        const isRelative = url.startsWith('.')
        const isSelfImport = !isRelative && cleanUrl(url) === cleanUrl(importer)

        // normalize all imports into resolved URLs
        // e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js'`
        if (resolved.id.startsWith(root + '/')) {
          // in root: infer short absolute path from root
          url = resolved.id.slice(root.length)
        } else if (
          resolved.id.startsWith(getDepsCacheDir(config)) ||
          fs.existsSync(cleanUrl(resolved.id))
        ) {
          // an optimized deps may not yet exists in the filesystem, or
          // a regular file exists but is out of root: rewrite to absolute /@fs/ paths
          url = path.posix.join(FS_PREFIX + resolved.id)
        } else {
          url = resolved.id
        }

        if (isExternalUrl(url)) {
          return [url, url]
        }

        // if the resolved id is not a valid browser import specifier,
        // prefix it to make it valid. We will strip this before feeding it
        // back into the transform pipeline
        if (!url.startsWith('.') && !url.startsWith('/')) {
          url =
            VALID_ID_PREFIX + resolved.id.replace('\0', NULL_BYTE_PLACEHOLDER)
        }

        // make the URL browser-valid if not SSR
        if (!ssr) {
          // mark non-js/css imports with `?import`
          url = markExplicitImport(url)

          // If the url isn't a request for a pre-bundled common chunk,
          // for relative js/css imports, or self-module virtual imports
          // (e.g. vue blocks), inherit importer's version query
          // do not do this for unknown type imports, otherwise the appended
          // query can break 3rd party plugin's extension checks.
          if (
            (isRelative || isSelfImport) &&
            !/[\?&]import=?\b/.test(url) &&
            !url.match(DEP_VERSION_RE)
          ) {
            const versionMatch = importer.match(DEP_VERSION_RE)
            if (versionMatch) {
              url = injectQuery(url, versionMatch[1])
            }
          }

          // check if the dep has been hmr updated. If yes, we need to attach
          // its last updated timestamp to force the browser to fetch the most
          // up-to-date version of this module.
          try {
            const depModule = await moduleGraph.ensureEntryFromUrl(url, ssr)
            if (depModule.lastHMRTimestamp > 0) {
              url = injectQuery(url, `t=${depModule.lastHMRTimestamp}`)
            }
          } catch (e: any) {
            // it's possible that the dep fails to resolve (non-existent import)
            // attach location to the missing import
            e.pos = pos
            throw e
          }

          // prepend base (dev base is guaranteed to have ending slash)
          url = base + url.replace(/^\//, '')
        }

        return [url, resolved.id]
      }

      for (let index = 0; index < imports.length; index++) {
        const {
          s: start,
          e: end,
          ss: expStart,
          d: dynamicIndex,
          // #2083 User may use escape path,
          // so use imports[index].n to get the unescaped string
          n: specifier
        } = imports[index]

        const rawUrl = source.slice(start, end)

        // check import.meta usage
        if (rawUrl === 'import.meta') {
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

        const isDynamicImport = dynamicIndex > -1

        // static import or valid string in dynamic import
        // If resolvable, let's resolve it
        if (specifier) {
          // skip external / data uri
          if (isExternalUrl(specifier) || isDataUrl(specifier)) {
            continue
          }
          // skip ssr external
          if (ssr) {
            if (config.ssr?.format === 'cjs') {
              if (cjsShouldExternalizeForSSR(specifier, server._ssrExternals)) {
                continue
              }
            } else if (shouldExternalizeForSSR(specifier, config)) {
              continue
            }
            if (isBuiltin(specifier)) {
              continue
            }
          }
          // skip client
          if (specifier === clientPublicPath) {
            continue
          }

          // warn imports to non-asset /public files
          if (
            specifier.startsWith('/') &&
            !config.assetsInclude(cleanUrl(specifier)) &&
            !specifier.endsWith('.json') &&
            checkPublicFile(specifier, config)
          ) {
            throw new Error(
              `Cannot import non-asset file ${specifier} which is inside /public.` +
                `JS/CSS files inside /public are copied as-is on build and ` +
                `can only be referenced via <script src> or <link href> in html.`
            )
          }

          // normalize
          const [url, resolvedId] = await normalizeUrl(specifier, start)

          // record as safe modules
          server?.moduleGraph.safeModulesPath.add(fsPathFromUrl(url))

          if (url !== specifier) {
            let rewriteDone = false
            if (
              depsOptimizer?.isOptimizedDepFile(resolvedId) &&
              !resolvedId.match(optimizedDepChunkRE)
            ) {
              // for optimized cjs deps, support named imports by rewriting named imports to const assignments.
              // internal optimized chunks don't need es interop and are excluded

              // The browserHash in resolvedId could be stale in which case there will be a full
              // page reload. We could return a 404 in that case but it is safe to return the request
              const file = cleanUrl(resolvedId) // Remove ?v={hash}

              const needsInterop = await optimizedDepNeedsInterop(
                depsOptimizer.metadata,
                file,
                config
              )

              if (needsInterop === undefined) {
                // Non-entry dynamic imports from dependencies will reach here as there isn't
                // optimize info for them, but they don't need es interop. If the request isn't
                // a dynamic import, then it is an internal Vite error
                if (!file.match(optimizedDepDynamicRE)) {
                  config.logger.error(
                    colors.red(
                      `Vite Error, ${url} optimized info should be defined`
                    )
                  )
                }
              } else if (needsInterop) {
                debug(`${url} needs interop`)
                interopNamedImports(str(), imports[index], url, index)
                rewriteDone = true
              }
            }
            // If source code imports builtin modules via named imports, the stub proxy export
            // would fail as it's `export default` only. Apply interop for builtin modules to
            // correctly throw the error message.
            else if (
              url.includes(browserExternalId) &&
              source.slice(expStart, start).includes('{')
            ) {
              interopNamedImports(str(), imports[index], url, index)
              rewriteDone = true
            }
            if (!rewriteDone) {
              str().overwrite(start, end, isDynamicImport ? `'${url}'` : url, {
                contentOnly: true
              })
            }
          }

          // record for HMR import chain analysis
          // make sure to normalize away base
          const urlWithoutBase = url.replace(base, '/')
          importedUrls.add(urlWithoutBase)
          if (!isDynamicImport) {
            // for pre-transforming
            staticImportedUrls.add({ url: urlWithoutBase, id: resolvedId })
          }
        } else if (!importer.startsWith(clientDir) && !ssr) {
          // check @vite-ignore which suppresses dynamic import warning
          const hasViteIgnore = /\/\*\s*@vite-ignore\s*\*\//.test(
            // complete expression inside parens
            source.slice(dynamicIndex + 1, end)
          )

          const url = rawUrl
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')
            .trim()
          if (!hasViteIgnore) {
            this.warn(
              `\n` +
                colors.cyan(importerModule.file) +
                `\n` +
                generateCodeFrame(source, start) +
                `\nThe above dynamic import cannot be analyzed by vite.\n` +
                `See ${colors.blue(
                  `https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations`
                )} ` +
                `for supported dynamic import formats. ` +
                `If this is intended to be left as-is, you can use the ` +
                `/* @vite-ignore */ comment inside the import() call to suppress this warning.\n`
            )
          }
          if (
            !/^('.*'|".*"|`.*`)$/.test(url) ||
            isExplicitImportRequired(url.slice(1, -1))
          ) {
            needQueryInjectHelper = true
            str().overwrite(
              start,
              end,
              `__vite__injectQuery(${url}, 'import')`,
              { contentOnly: true }
            )
          }
        }
      }

      if (hasEnv) {
        // inject import.meta.env
        let env = `import.meta.env = ${JSON.stringify({
          ...config.env,
          SSR: !!ssr
        })};`
        // account for user env defines
        for (const key in config.define) {
          if (key.startsWith(`import.meta.env.`)) {
            const val = config.define[key]
            env += `${key} = ${
              typeof val === 'string' ? val : JSON.stringify(val)
            };`
          }
        }
        str().prepend(env)
      }

      if (hasHMR && !ssr) {
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
          `import { createHotContext as __vite__createHotContext } from "${clientPublicPath}";` +
            `import.meta.hot = __vite__createHotContext(${JSON.stringify(
              importerModule.url
            )});`
        )
      }

      if (needQueryInjectHelper) {
        str().prepend(
          `import { injectQuery as __vite__injectQuery } from "${clientPublicPath}";`
        )
      }

      // normalize and rewrite accepted urls
      const normalizedAcceptedUrls = new Set<string>()
      for (const { url, start, end } of acceptedUrls) {
        const [normalized] = await moduleGraph.resolveUrl(
          toAbsoluteUrl(markExplicitImport(url)),
          ssr
        )
        normalizedAcceptedUrls.add(normalized)
        str().overwrite(start, end, JSON.stringify(normalized), {
          contentOnly: true
        })
      }

      // update the module graph for HMR analysis.
      // node CSS imports does its own graph update in the css plugin so we
      // only handle js graph updates here.
      if (!isCSSRequest(importer)) {
        // attached by pluginContainer.addWatchFile
        const pluginImports = (this as any)._addedImports as
          | Set<string>
          | undefined
        if (pluginImports) {
          ;(
            await Promise.all(
              [...pluginImports].map((id) => normalizeUrl(id, 0))
            )
          ).forEach(([url]) => importedUrls.add(url))
        }
        // HMR transforms are no-ops in SSR, so an `accept` call will
        // never be injected. Avoid updating the `isSelfAccepting`
        // property for our module node in that case.
        if (ssr && importerModule.isSelfAccepting) {
          isSelfAccepting = true
        }
        const prunedImports = await moduleGraph.updateModuleInfo(
          importerModule,
          importedUrls,
          normalizedAcceptedUrls,
          isSelfAccepting,
          ssr
        )
        if (hasHMR && prunedImports) {
          handlePrunedModules(prunedImports, server)
        }
      }

      isDebug &&
        debug(
          `${timeFrom(start)} ${colors.dim(
            `[${importedUrls.size} imports rewritten] ${prettyImporter}`
          )}`
        )

      // pre-transform known direct imports
      // TODO: we should also crawl dynamic imports
      if (config.server.preTransformRequests && staticImportedUrls.size) {
        staticImportedUrls.forEach(({ url, id }) => {
          url = unwrapId(removeImportQuery(url)).replace(
            NULL_BYTE_PLACEHOLDER,
            '\0'
          )
          const request = transformRequest(url, server, { ssr }).catch((e) => {
            if (e?.code === ERR_OUTDATED_OPTIMIZED_DEP) {
              // This are expected errors
              return
            }
            // Unexpected error, log the issue but avoid an unhandled exception
            config.logger.error(e.message)
          })
          if (!config.optimizeDeps.devScan) {
            delayDepsOptimizerUntil(config, id, () => request)
          }
        })
      }

      if (s) {
        return transformResult(s, importer, config)
      } else {
        return source
      }
    }
  }
}

function interopNamedImports(
  str: MagicString,
  importSpecifier: ImportSpecifier,
  rewrittenUrl: string,
  importIndex: number
) {
  const source = str.original
  const {
    s: start,
    e: end,
    ss: expStart,
    se: expEnd,
    d: dynamicIndex
  } = importSpecifier
  if (dynamicIndex > -1) {
    // rewrite `import('package')` to expose the default directly
    str.overwrite(
      expStart,
      expEnd,
      `import('${rewrittenUrl}').then(m => m.default && m.default.__esModule ? m.default : ({ ...m.default, default: m.default }))`,
      { contentOnly: true }
    )
  } else {
    const exp = source.slice(expStart, expEnd)
    const rawUrl = source.slice(start, end)
    const rewritten = transformCjsImport(exp, rewrittenUrl, rawUrl, importIndex)
    if (rewritten) {
      str.overwrite(expStart, expEnd, rewritten, { contentOnly: true })
    } else {
      // #1439 export * from '...'
      str.overwrite(start, end, rewrittenUrl, { contentOnly: true })
    }
  }
}

type ImportNameSpecifier = { importedName: string; localName: string }

/**
 * Detect import statements to a known optimized CJS dependency and provide
 * ES named imports interop. We do this by rewriting named imports to a variable
 * assignment to the corresponding property on the `module.exports` of the cjs
 * module. Note this doesn't support dynamic re-assignments from within the cjs
 * module.
 *
 * Note that es-module-lexer treats `export * from '...'` as an import as well,
 * so, we may encounter ExportAllDeclaration here, in which case `undefined`
 * will be returned.
 *
 * Credits \@csr632 via #837
 */
export function transformCjsImport(
  importExp: string,
  url: string,
  rawUrl: string,
  importIndex: number
): string | undefined {
  const node = (
    parseJS(importExp, {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }) as any
  ).body[0] as Node

  if (
    node.type === 'ImportDeclaration' ||
    node.type === 'ExportNamedDeclaration'
  ) {
    if (!node.specifiers.length) {
      return `import "${url}"`
    }

    const importNames: ImportNameSpecifier[] = []
    const exportNames: string[] = []
    let defaultExports: string = ''
    for (const spec of node.specifiers) {
      if (
        spec.type === 'ImportSpecifier' &&
        spec.imported.type === 'Identifier'
      ) {
        const importedName = spec.imported.name
        const localName = spec.local.name
        importNames.push({ importedName, localName })
      } else if (spec.type === 'ImportDefaultSpecifier') {
        importNames.push({
          importedName: 'default',
          localName: spec.local.name
        })
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        importNames.push({ importedName: '*', localName: spec.local.name })
      } else if (
        spec.type === 'ExportSpecifier' &&
        spec.exported.type === 'Identifier'
      ) {
        // for ExportSpecifier, local name is same as imported name
        const importedName = spec.local.name
        // we want to specify exported name as variable and re-export it
        const exportedName = spec.exported.name
        if (exportedName === 'default') {
          defaultExports = makeLegalIdentifier(
            `__vite__cjsExportDefault_${importIndex}`
          )
          importNames.push({ importedName, localName: defaultExports })
        } else {
          importNames.push({ importedName, localName: exportedName })
          exportNames.push(exportedName)
        }
      }
    }

    // If there is multiple import for same id in one file,
    // importIndex will prevent the cjsModuleName to be duplicate
    const cjsModuleName = makeLegalIdentifier(
      `__vite__cjsImport${importIndex}_${rawUrl}`
    )
    const lines: string[] = [`import ${cjsModuleName} from "${url}"`]
    importNames.forEach(({ importedName, localName }) => {
      if (importedName === '*') {
        lines.push(`const ${localName} = ${cjsModuleName}`)
      } else if (importedName === 'default') {
        lines.push(
          `const ${localName} = ${cjsModuleName}.__esModule ? ${cjsModuleName}.default : ${cjsModuleName}`
        )
      } else {
        lines.push(`const ${localName} = ${cjsModuleName}["${importedName}"]`)
      }
    })
    if (defaultExports) {
      lines.push(`export default ${defaultExports}`)
    }
    if (exportNames.length) {
      lines.push(`export { ${exportNames.join(', ')} }`)
    }

    return lines.join('; ')
  }
}
