import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import colors from 'picocolors'
import MagicString from 'magic-string'
import type { ExportSpecifier, ImportSpecifier } from 'es-module-lexer'
import { init, parse as parseImports } from 'es-module-lexer'
import { parse as parseJS } from 'acorn'
import type { Node } from 'estree'
import { findStaticImports, parseStaticImport } from 'mlly'
import { makeLegalIdentifier } from '@rollup/pluginutils'
import type { ViteDevServer } from '..'
import {
  CLIENT_DIR,
  CLIENT_PUBLIC_PATH,
  DEP_VERSION_RE,
  FS_PREFIX,
} from '../constants'
import {
  debugHmr,
  handlePrunedModules,
  lexAcceptedHmrDeps,
  lexAcceptedHmrExports,
  normalizeHmrUrl,
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
  isInNodeModules,
  isJSRequest,
  joinUrlSegments,
  moduleListContains,
  normalizePath,
  prettifyUrl,
  removeImportQuery,
  stripBase,
  stripBomTag,
  timeFrom,
  transformStableResult,
  unwrapId,
  wrapId,
} from '../utils'
import { getDepOptimizationConfig } from '../config'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import {
  cjsShouldExternalizeForSSR,
  shouldExternalizeForSSR,
} from '../ssr/ssrExternal'
import { getDepsOptimizer, optimizedDepNeedsInterop } from '../optimizer'
import { ERR_CLOSED_SERVER } from '../server/pluginContainer'
import { checkPublicFile, urlRE } from './asset'
import {
  ERR_OUTDATED_OPTIMIZED_DEP,
  throwOutdatedRequest,
} from './optimizedDeps'
import { isCSSRequest, isDirectCSSRequest, isModuleCSSRequest } from './css'
import { browserExternalId } from './resolve'

const debug = createDebugger('vite:import-analysis')

const clientDir = normalizePath(CLIENT_DIR)

const skipRE = /\.(?:map|json)(?:$|\?)/
export const canSkipImportAnalysis = (id: string): boolean =>
  skipRE.test(id) || isDirectCSSRequest(id)

const optimizedDepChunkRE = /\/chunk-[A-Z\d]{8}\.js/
const optimizedDepDynamicRE = /-[A-Z\d]{8}\.js/

const hasImportInQueryParamsRE = /[?&]import=?\b/

const hasViteIgnoreRE = /\/\*\s*@vite-ignore\s*\*\//

const cleanUpRawUrlRE = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm
const urlIsStringRE = /^(?:'.*'|".*"|`.*`)$/

interface UrlPosition {
  url: string
  start: number
  end: number
}

export function isExplicitImportRequired(url: string): boolean {
  return !isJSRequest(cleanUrl(url)) && !isCSSRequest(url)
}

function markExplicitImport(url: string) {
  if (isExplicitImportRequired(url)) {
    return injectQuery(url, 'import')
  }
  return url
}

function extractImportedBindings(
  id: string,
  source: string,
  importSpec: ImportSpecifier,
  importedBindings: Map<string, Set<string>>,
) {
  let bindings = importedBindings.get(id)
  if (!bindings) {
    bindings = new Set<string>()
    importedBindings.set(id, bindings)
  }

  const isDynamic = importSpec.d > -1
  const isMeta = importSpec.d === -2
  if (isDynamic || isMeta) {
    // this basically means the module will be impacted by any change in its dep
    bindings.add('*')
    return
  }

  const exp = source.slice(importSpec.ss, importSpec.se)
  const [match0] = findStaticImports(exp)
  if (!match0) {
    return
  }
  const parsed = parseStaticImport(match0)
  if (!parsed) {
    return
  }
  if (parsed.namespacedImport) {
    bindings.add('*')
  }
  if (parsed.defaultImport) {
    bindings.add('default')
  }
  if (parsed.namedImports) {
    for (const name of Object.keys(parsed.namedImports)) {
      bindings.add(name)
    }
  }
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
 * css (referenced via `<link>`) may go through the transform pipeline:
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
  const enablePartialAccept = config.experimental?.hmrPartialAccept
  let server: ViteDevServer

  let _env: string | undefined
  function getEnv(ssr: boolean) {
    if (!_env) {
      _env = `import.meta.env = ${JSON.stringify({
        ...config.env,
        SSR: '__vite__ssr__',
      })};`
      // account for user env defines
      for (const key in config.define) {
        if (key.startsWith(`import.meta.env.`)) {
          const val = config.define[key]
          _env += `${key} = ${
            typeof val === 'string' ? val : JSON.stringify(val)
          };`
        }
      }
    }
    return _env.replace('"__vite__ssr__"', ssr + '')
  }

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
        debug?.(colors.dim(`[skipped] ${prettyImporter}`))
        return null
      }

      const start = performance.now()
      await init
      let imports!: readonly ImportSpecifier[]
      let exports!: readonly ExportSpecifier[]
      source = stripBomTag(source)
      try {
        ;[imports, exports] = parseImports(source)
      } catch (e: any) {
        const isVue = importer.endsWith('.vue')
        const isJsx = importer.endsWith('.jsx') || importer.endsWith('.tsx')
        const maybeJSX = !isVue && isJSRequest(importer)

        const msg = isVue
          ? `Install @vitejs/plugin-vue to handle .vue files.`
          : maybeJSX
          ? isJsx
            ? `If you use tsconfig.json, make sure to not set jsx to preserve.`
            : `If you are using JSX, make sure to name the file with the .jsx or .tsx extension.`
          : `You may need to install appropriate plugins to handle the ${path.extname(
              importer,
            )} file format, or if it's an asset, add "**/*${path.extname(
              importer,
            )}" to \`assetsInclude\` in your configuration.`

        this.error(
          `Failed to parse source for import analysis because the content ` +
            `contains invalid JS syntax. ` +
            msg,
          e.idx,
        )
      }

      const depsOptimizer = getDepsOptimizer(config, ssr)

      const { moduleGraph } = server
      // since we are already in the transform phase of the importer, it must
      // have been loaded so its entry is guaranteed in the module graph.
      const importerModule = moduleGraph.getModuleById(importer)!
      if (!importerModule) {
        // This request is no longer valid. It could happen for optimized deps
        // requests. A full reload is going to request this id again.
        // Throwing an outdated error so we properly finish the request with a
        // 504 sent to the browser.
        throwOutdatedRequest(importer)
      }

      if (!imports.length && !(this as any)._addedImports) {
        importerModule.isSelfAccepting = false
        debug?.(
          `${timeFrom(start)} ${colors.dim(`[no imports] ${prettyImporter}`)}`,
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
      let isPartiallySelfAccepting = false
      const importedBindings = enablePartialAccept
        ? new Map<string, Set<string>>()
        : null
      const toAbsoluteUrl = (url: string) =>
        path.posix.resolve(path.posix.dirname(importerModule.url), url)

      const normalizeUrl = async (
        url: string,
        pos: number,
        forceSkipImportAnalysis: boolean = false,
      ): Promise<[string, string]> => {
        url = stripBase(url, base)

        let importerFile = importer

        const optimizeDeps = getDepOptimizationConfig(config, ssr)
        if (moduleListContains(optimizeDeps?.exclude, url)) {
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
          // fix#9534, prevent the importerModuleNode being stopped from propagating updates
          importerModule.isSelfAccepting = false
          return this.error(
            `Failed to resolve import "${url}" from "${path.relative(
              process.cwd(),
              importerFile,
            )}". Does the file exist?`,
            pos,
          )
        }

        const isRelative = url[0] === '.'
        const isSelfImport = !isRelative && cleanUrl(url) === cleanUrl(importer)

        // normalize all imports into resolved URLs
        // e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js'`
        if (resolved.id.startsWith(root + '/')) {
          // in root: infer short absolute path from root
          url = resolved.id.slice(root.length)
        } else if (
          depsOptimizer?.isOptimizedDepFile(resolved.id) ||
          fs.existsSync(cleanUrl(resolved.id))
        ) {
          // an optimized deps may not yet exists in the filesystem, or
          // a regular file exists but is out of root: rewrite to absolute /@fs/ paths
          url = path.posix.join(FS_PREFIX, resolved.id)
        } else {
          url = resolved.id
        }

        if (isExternalUrl(url)) {
          return [url, url]
        }

        // if the resolved id is not a valid browser import specifier,
        // prefix it to make it valid. We will strip this before feeding it
        // back into the transform pipeline
        if (url[0] !== '.' && url[0] !== '/') {
          url = wrapId(resolved.id)
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
            !hasImportInQueryParamsRE.test(url) &&
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
            // delay setting `isSelfAccepting` until the file is actually used (#7870)
            // We use an internal function to avoid resolving the url again
            const depModule = await moduleGraph._ensureEntryFromUrl(
              unwrapId(url),
              ssr,
              canSkipImportAnalysis(url) || forceSkipImportAnalysis,
              resolved,
            )
            if (depModule.lastHMRTimestamp > 0) {
              url = injectQuery(url, `t=${depModule.lastHMRTimestamp}`)
            }
          } catch (e: any) {
            // it's possible that the dep fails to resolve (non-existent import)
            // attach location to the missing import
            e.pos = pos
            throw e
          }

          // prepend base
          url = joinUrlSegments(base, url)
        }

        return [url, resolved.id]
      }

      const orderedAcceptedUrls = new Array<Set<UrlPosition> | undefined>(
        imports.length,
      )
      const orderedAcceptedExports = new Array<Set<string> | undefined>(
        imports.length,
      )

      await Promise.all(
        imports.map(async (importSpecifier, index) => {
          const {
            s: start,
            e: end,
            ss: expStart,
            se: expEnd,
            d: dynamicIndex,
            // #2083 User may use escape path,
            // so use imports[index].n to get the unescaped string
            n: specifier,
            a: assertIndex,
          } = importSpecifier

          const rawUrl = source.slice(start, end)

          // check import.meta usage
          if (rawUrl === 'import.meta') {
            const prop = source.slice(end, end + 4)
            if (prop === '.hot') {
              hasHMR = true
              const endHot = end + 4 + (source[end + 4] === '?' ? 1 : 0)
              if (source.slice(endHot, endHot + 7) === '.accept') {
                // further analyze accepted modules
                if (source.slice(endHot, endHot + 14) === '.acceptExports') {
                  const importAcceptedExports = (orderedAcceptedExports[index] =
                    new Set<string>())
                  lexAcceptedHmrExports(
                    source,
                    source.indexOf('(', endHot + 14) + 1,
                    importAcceptedExports,
                  )
                  isPartiallySelfAccepting = true
                } else {
                  const importAcceptedUrls = (orderedAcceptedUrls[index] =
                    new Set<UrlPosition>())
                  if (
                    lexAcceptedHmrDeps(
                      source,
                      source.indexOf('(', endHot + 7) + 1,
                      importAcceptedUrls,
                    )
                  ) {
                    isSelfAccepting = true
                  }
                }
              }
            } else if (prop === '.env') {
              hasEnv = true
            }
            return
          }

          const isDynamicImport = dynamicIndex > -1

          // strip import assertions as we can process them ourselves
          if (!isDynamicImport && assertIndex > -1) {
            str().remove(end + 1, expEnd)
          }

          // static import or valid string in dynamic import
          // If resolvable, let's resolve it
          if (specifier) {
            // skip external / data uri
            if (isExternalUrl(specifier) || isDataUrl(specifier)) {
              return
            }
            // skip ssr external
            if (ssr) {
              if (config.legacy?.buildSsrCjsExternalHeuristics) {
                if (
                  cjsShouldExternalizeForSSR(specifier, server._ssrExternals)
                ) {
                  return
                }
              } else if (shouldExternalizeForSSR(specifier, config)) {
                return
              }
              if (isBuiltin(specifier)) {
                return
              }
            }
            // skip client
            if (specifier === clientPublicPath) {
              return
            }

            // warn imports to non-asset /public files
            if (
              specifier[0] === '/' &&
              !(
                config.assetsInclude(cleanUrl(specifier)) ||
                urlRE.test(specifier)
              ) &&
              checkPublicFile(specifier, config)
            ) {
              throw new Error(
                `Cannot import non-asset file ${specifier} which is inside /public. ` +
                  `JS/CSS files inside /public are copied as-is on build and ` +
                  `can only be referenced via <script src> or <link href> in html. ` +
                  `If you want to get the URL of that file, use ${injectQuery(
                    specifier,
                    'url',
                  )} instead.`,
              )
            }

            // normalize
            const [url, resolvedId] = await normalizeUrl(specifier, start)

            if (
              !isDynamicImport &&
              specifier &&
              !specifier.includes('?') && // ignore custom queries
              isCSSRequest(resolvedId) &&
              !isModuleCSSRequest(resolvedId)
            ) {
              const sourceExp = source.slice(expStart, start)
              if (
                sourceExp.includes('from') && // check default and named imports
                !sourceExp.includes('__vite_glob_') // glob handles deprecation message itself
              ) {
                const newImport =
                  sourceExp + specifier + `?inline` + source.slice(end, expEnd)
                this.warn(
                  `\n` +
                    colors.cyan(importerModule.file) +
                    `\n` +
                    colors.reset(generateCodeFrame(source, start)) +
                    `\n` +
                    colors.yellow(
                      `Default and named imports from CSS files are deprecated. ` +
                        `Use the ?inline query instead. ` +
                        `For example: ${newImport}`,
                    ),
                )
              }
            }

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
                  config,
                  ssr,
                )

                if (needsInterop === undefined) {
                  // Non-entry dynamic imports from dependencies will reach here as there isn't
                  // optimize info for them, but they don't need es interop. If the request isn't
                  // a dynamic import, then it is an internal Vite error
                  if (!file.match(optimizedDepDynamicRE)) {
                    config.logger.error(
                      colors.red(
                        `Vite Error, ${url} optimized info should be defined`,
                      ),
                    )
                  }
                } else if (needsInterop) {
                  debug?.(`${url} needs interop`)
                  interopNamedImports(
                    str(),
                    importSpecifier,
                    url,
                    index,
                    importer,
                    config,
                  )
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
                interopNamedImports(
                  str(),
                  importSpecifier,
                  url,
                  index,
                  importer,
                  config,
                )
                rewriteDone = true
              }
              if (!rewriteDone) {
                const rewrittenUrl = JSON.stringify(url)
                const s = isDynamicImport ? start : start - 1
                const e = isDynamicImport ? end : end + 1
                str().overwrite(s, e, rewrittenUrl, {
                  contentOnly: true,
                })
              }
            }

            // record for HMR import chain analysis
            // make sure to unwrap and normalize away base
            const hmrUrl = unwrapId(stripBase(url, base))
            const isLocalImport = !isExternalUrl(hmrUrl) && !isDataUrl(hmrUrl)
            if (isLocalImport) {
              importedUrls.add(hmrUrl)
            }

            if (enablePartialAccept && importedBindings) {
              extractImportedBindings(
                resolvedId,
                source,
                importSpecifier,
                importedBindings,
              )
            }

            if (
              !isDynamicImport &&
              isLocalImport &&
              config.server.preTransformRequests
            ) {
              // pre-transform known direct imports
              // These requests will also be registered in transformRequest to be awaited
              // by the deps optimizer
              const url = removeImportQuery(hmrUrl)
              server.transformRequest(url, { ssr }).catch((e) => {
                if (
                  e?.code === ERR_OUTDATED_OPTIMIZED_DEP ||
                  e?.code === ERR_CLOSED_SERVER
                ) {
                  // these are expected errors
                  return
                }
                // Unexpected error, log the issue but avoid an unhandled exception
                config.logger.error(e.message)
              })
            }
          } else if (!importer.startsWith(clientDir)) {
            if (!isInNodeModules(importer)) {
              // check @vite-ignore which suppresses dynamic import warning
              const hasViteIgnore = hasViteIgnoreRE.test(
                // complete expression inside parens
                source.slice(dynamicIndex + 1, end),
              )
              if (!hasViteIgnore) {
                this.warn(
                  `\n` +
                    colors.cyan(importerModule.file) +
                    `\n` +
                    colors.reset(generateCodeFrame(source, start)) +
                    colors.yellow(
                      `\nThe above dynamic import cannot be analyzed by Vite.\n` +
                        `See ${colors.blue(
                          `https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations`,
                        )} ` +
                        `for supported dynamic import formats. ` +
                        `If this is intended to be left as-is, you can use the ` +
                        `/* @vite-ignore */ comment inside the import() call to suppress this warning.\n`,
                    ),
                )
              }
            }

            if (!ssr) {
              const url = rawUrl.replace(cleanUpRawUrlRE, '').trim()
              if (
                !urlIsStringRE.test(url) ||
                isExplicitImportRequired(url.slice(1, -1))
              ) {
                needQueryInjectHelper = true
                str().overwrite(
                  start,
                  end,
                  `__vite__injectQuery(${url}, 'import')`,
                  { contentOnly: true },
                )
              }
            }
          }
        }),
      )

      const acceptedUrls = mergeAcceptedUrls(orderedAcceptedUrls)
      const acceptedExports = mergeAcceptedUrls(orderedAcceptedExports)

      if (hasEnv) {
        // inject import.meta.env
        str().prepend(getEnv(ssr))
      }

      if (hasHMR && !ssr) {
        debugHmr?.(
          `${
            isSelfAccepting
              ? `[self-accepts]`
              : isPartiallySelfAccepting
              ? `[accepts-exports]`
              : acceptedUrls.size
              ? `[accepts-deps]`
              : `[detected api usage]`
          } ${prettyImporter}`,
        )
        // inject hot context
        str().prepend(
          `import { createHotContext as __vite__createHotContext } from "${clientPublicPath}";` +
            `import.meta.hot = __vite__createHotContext(${JSON.stringify(
              normalizeHmrUrl(importerModule.url),
            )});`,
        )
      }

      if (needQueryInjectHelper) {
        str().prepend(
          `import { injectQuery as __vite__injectQuery } from "${clientPublicPath}";`,
        )
      }

      // normalize and rewrite accepted urls
      const normalizedAcceptedUrls = new Set<string>()
      for (const { url, start, end } of acceptedUrls) {
        const isRelative = url[0] === '.'
        const [normalized] = await moduleGraph.resolveUrl(
          isRelative ? toAbsoluteUrl(url) : url,
          ssr,
        )
        normalizedAcceptedUrls.add(normalized)
        str().overwrite(start, end, JSON.stringify(normalized), {
          contentOnly: true,
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
              [...pluginImports].map((id) => normalizeUrl(id, 0, true)),
            )
          ).forEach(([url]) => importedUrls.add(url))
        }
        // HMR transforms are no-ops in SSR, so an `accept` call will
        // never be injected. Avoid updating the `isSelfAccepting`
        // property for our module node in that case.
        if (ssr && importerModule.isSelfAccepting) {
          isSelfAccepting = true
        }
        // a partially accepted module that accepts all its exports
        // behaves like a self-accepted module in practice
        if (
          !isSelfAccepting &&
          isPartiallySelfAccepting &&
          acceptedExports.size >= exports.length &&
          exports.every((e) => acceptedExports.has(e.n))
        ) {
          isSelfAccepting = true
        }
        const prunedImports = await moduleGraph.updateModuleInfo(
          importerModule,
          importedUrls,
          importedBindings,
          normalizedAcceptedUrls,
          isPartiallySelfAccepting ? acceptedExports : null,
          isSelfAccepting,
          ssr,
        )
        if (hasHMR && prunedImports) {
          handlePrunedModules(prunedImports, server)
        }
      }

      debug?.(
        `${timeFrom(start)} ${colors.dim(
          `[${importedUrls.size} imports rewritten] ${prettyImporter}`,
        )}`,
      )

      if (s) {
        return transformStableResult(s, importer, config)
      } else {
        return source
      }
    },
  }
}

function mergeAcceptedUrls<T>(orderedUrls: Array<Set<T> | undefined>) {
  const acceptedUrls = new Set<T>()
  for (const urls of orderedUrls) {
    if (!urls) continue
    for (const url of urls) acceptedUrls.add(url)
  }
  return acceptedUrls
}

export function interopNamedImports(
  str: MagicString,
  importSpecifier: ImportSpecifier,
  rewrittenUrl: string,
  importIndex: number,
  importer: string,
  config: ResolvedConfig,
): void {
  const source = str.original
  const {
    s: start,
    e: end,
    ss: expStart,
    se: expEnd,
    d: dynamicIndex,
  } = importSpecifier
  if (dynamicIndex > -1) {
    // rewrite `import('package')` to expose the default directly
    str.overwrite(
      expStart,
      expEnd,
      `import('${rewrittenUrl}').then(m => m.default && m.default.__esModule ? m.default : ({ ...m.default, default: m.default }))`,
      { contentOnly: true },
    )
  } else {
    const exp = source.slice(expStart, expEnd)
    const rawUrl = source.slice(start, end)
    const rewritten = transformCjsImport(
      exp,
      rewrittenUrl,
      rawUrl,
      importIndex,
      importer,
      config,
    )
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
  importIndex: number,
  importer: string,
  config: ResolvedConfig,
): string | undefined {
  const node = (
    parseJS(importExp, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    }) as any
  ).body[0] as Node

  // `export * from '...'` may cause unexpected problem, so give it a warning
  if (
    config.command === 'serve' &&
    node.type === 'ExportAllDeclaration' &&
    !node.exported
  ) {
    config.logger.warn(
      colors.yellow(
        `\nUnable to interop \`${importExp}\` in ${importer}, this may lose module exports. Please export "${rawUrl}" as ESM or use named exports instead, e.g. \`export { A, B } from "${rawUrl}"\``,
      ),
    )
  } else if (
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
          localName: spec.local.name,
        })
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        importNames.push({ importedName: '*', localName: spec.local.name })
      } else if (
        spec.type === 'ExportSpecifier' &&
        spec.exported.type === 'Identifier'
      ) {
        // for ExportSpecifier, local name is same as imported name
        // prefix the variable name to avoid clashing with other local variables
        const importedName = spec.local.name
        // we want to specify exported name as variable and re-export it
        const exportedName = spec.exported.name
        if (exportedName === 'default') {
          defaultExports = makeLegalIdentifier(
            `__vite__cjsExportDefault_${importIndex}`,
          )
          importNames.push({ importedName, localName: defaultExports })
        } else {
          const localName = makeLegalIdentifier(
            `__vite__cjsExport_${exportedName}`,
          )
          importNames.push({ importedName, localName })
          exportNames.push(`${localName} as ${exportedName}`)
        }
      }
    }

    // If there is multiple import for same id in one file,
    // importIndex will prevent the cjsModuleName to be duplicate
    const cjsModuleName = makeLegalIdentifier(
      `__vite__cjsImport${importIndex}_${rawUrl}`,
    )
    const lines: string[] = [`import ${cjsModuleName} from "${url}"`]
    importNames.forEach(({ importedName, localName }) => {
      if (importedName === '*') {
        lines.push(`const ${localName} = ${cjsModuleName}`)
      } else if (importedName === 'default') {
        lines.push(
          `const ${localName} = ${cjsModuleName}.__esModule ? ${cjsModuleName}.default : ${cjsModuleName}`,
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
