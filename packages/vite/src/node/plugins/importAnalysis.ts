import path from 'node:path'
import fs from 'node:fs'
import { performance } from 'node:perf_hooks'
import colors from 'picocolors'
import MagicString from 'magic-string'
import type {
  ParseError as EsModuleLexerParseError,
  ExportSpecifier,
  ImportSpecifier,
} from 'es-module-lexer'
import { init, parse as parseImports } from 'es-module-lexer'
import { parseAst } from 'rollup/parseAst'
import type { StaticImport } from 'mlly'
import { ESM_STATIC_IMPORT_RE, parseStaticImport } from 'mlly'
import { makeLegalIdentifier } from '@rollup/pluginutils'
import type { PartialResolvedId, RollupError } from 'rollup'
import type { Identifier, Literal } from 'estree'
import {
  CLIENT_DIR,
  CLIENT_PUBLIC_PATH,
  DEP_VERSION_RE,
  FS_PREFIX,
  SPECIAL_QUERY_RE,
} from '../constants'
import {
  debugHmr,
  handlePrunedModules,
  lexAcceptedHmrDeps,
  lexAcceptedHmrExports,
  normalizeHmrUrl,
} from '../server/hmr'
import {
  createDebugger,
  fsPathFromUrl,
  generateCodeFrame,
  getHash,
  injectQuery,
  isBuiltin,
  isDataUrl,
  isDefined,
  isExternalUrl,
  isInNodeModules,
  isJSRequest,
  joinUrlSegments,
  moduleListContains,
  normalizePath,
  prettifyUrl,
  removeImportQuery,
  removeTimestampQuery,
  stripBase,
  stripBomTag,
  timeFrom,
  transformStableResult,
  urlRE,
} from '../utils'
import { checkPublicFile } from '../publicDir'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import type { DevEnvironment } from '../server/environment'
import { shouldExternalize } from '../external'
import { optimizedDepNeedsInterop } from '../optimizer'
import {
  cleanUrl,
  unwrapId,
  withTrailingSlash,
  wrapId,
} from '../../shared/utils'
import type { TransformPluginContext } from '../server/pluginContainer'
import { throwOutdatedRequest } from './optimizedDeps'
import { isCSSRequest, isDirectCSSRequest } from './css'
import { browserExternalId } from './resolve'
import { serializeDefine } from './define'
import { WORKER_FILE_ID } from './worker'
import { getAliasPatternMatcher } from './preAlias'

const debug = createDebugger('vite:import-analysis')

const clientDir = normalizePath(CLIENT_DIR)

const skipRE = /\.(?:map|json)(?:$|\?)/
export const canSkipImportAnalysis = (id: string): boolean =>
  skipRE.test(id) || isDirectCSSRequest(id)

const optimizedDepChunkRE = /\/chunk-[A-Z\d]{8}\.js/
const optimizedDepDynamicRE = /-[A-Z\d]{8}\.js/

export const hasViteIgnoreRE = /\/\*\s*@vite-ignore\s*\*\//

const urlIsStringRE = /^(?:'.*'|".*"|`.*`)$/

const templateLiteralRE = /^\s*`(.*)`\s*$/

interface UrlPosition {
  url: string
  start: number
  end: number
}

export function isExplicitImportRequired(url: string): boolean {
  return !isJSRequest(url) && !isCSSRequest(url)
}

export function normalizeResolvedIdToUrl(
  environment: DevEnvironment,
  url: string,
  resolved: PartialResolvedId,
): string {
  const root = environment.config.root
  const depsOptimizer = environment.depsOptimizer

  // normalize all imports into resolved URLs
  // e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js'`
  if (resolved.id.startsWith(withTrailingSlash(root))) {
    // in root: infer short absolute path from root
    url = resolved.id.slice(root.length)
  } else if (
    depsOptimizer?.isOptimizedDepFile(resolved.id) ||
    // vite-plugin-react isn't following the leading \0 virtual module convention.
    // This is a temporary hack to avoid expensive fs checks for React apps.
    // We'll remove this as soon we're able to fix the react plugins.
    (resolved.id !== '/@react-refresh' &&
      path.isAbsolute(resolved.id) &&
      fs.existsSync(cleanUrl(resolved.id)))
  ) {
    // an optimized deps may not yet exists in the filesystem, or
    // a regular file exists but is out of root: rewrite to absolute /@fs/ paths
    url = path.posix.join(FS_PREFIX, resolved.id)
  } else {
    url = resolved.id
  }

  // if the resolved id is not a valid browser import specifier,
  // prefix it to make it valid. We will strip this before feeding it
  // back into the transform pipeline
  if (url[0] !== '.' && url[0] !== '/') {
    url = wrapId(resolved.id)
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
  ESM_STATIC_IMPORT_RE.lastIndex = 0
  const match = ESM_STATIC_IMPORT_RE.exec(exp)
  if (!match) {
    return
  }

  const staticImport: StaticImport = {
    type: 'static',
    code: match[0],
    start: match.index,
    end: match.index + match[0].length,
    imports: match.groups!.imports,
    specifier: match.groups!.specifier,
  }
  const parsed = parseStaticImport(staticImport)
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
 * Dev-only plugin that lexes, resolves, rewrites and analyzes url imports.
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
  const enablePartialAccept = config.experimental.hmrPartialAccept
  const matchAlias = getAliasPatternMatcher(config.resolve.alias)

  let _env: string | undefined
  let _ssrEnv: string | undefined
  function getEnv(ssr: boolean) {
    if (!_ssrEnv || !_env) {
      const importMetaEnvKeys: Record<string, any> = {}
      const userDefineEnv: Record<string, any> = {}
      for (const key in config.env) {
        importMetaEnvKeys[key] = JSON.stringify(config.env[key])
      }
      for (const key in config.define) {
        // non-import.meta.env.* is handled in `clientInjection` plugin
        if (key.startsWith('import.meta.env.')) {
          userDefineEnv[key.slice(16)] = config.define[key]
        }
      }
      const env = `import.meta.env = ${serializeDefine({
        ...importMetaEnvKeys,
        SSR: '__vite_ssr__',
        ...userDefineEnv,
      })};`
      _ssrEnv = env.replace('__vite_ssr__', 'true')
      _env = env.replace('__vite_ssr__', 'false')
    }
    return ssr ? _ssrEnv : _env
  }

  return {
    name: 'vite:import-analysis',

    async transform(source, importer) {
      const environment = this.environment as DevEnvironment
      const ssr = environment.config.consumer === 'server'
      const moduleGraph = environment.moduleGraph

      if (canSkipImportAnalysis(importer)) {
        debug?.(colors.dim(`[skipped] ${prettifyUrl(importer, root)}`))
        return null
      }

      const msAtStart = debug ? performance.now() : 0
      await init
      let imports!: readonly ImportSpecifier[]
      let exports!: readonly ExportSpecifier[]
      source = stripBomTag(source)
      try {
        ;[imports, exports] = parseImports(source)
      } catch (_e: unknown) {
        const e = _e as EsModuleLexerParseError
        const { message, showCodeFrame } = createParseErrorInfo(
          importer,
          source,
        )
        this.error(message, showCodeFrame ? e.idx : undefined)
      }

      const depsOptimizer = environment.depsOptimizer

      // since we are already in the transform phase of the importer, it must
      // have been loaded so its entry is guaranteed in the module graph.
      const importerModule = moduleGraph.getModuleById(importer)
      if (!importerModule) {
        // This request is no longer valid. It could happen for optimized deps
        // requests. A full reload is going to request this id again.
        // Throwing an outdated error so we properly finish the request with a
        // 504 sent to the browser.
        throwOutdatedRequest(importer)
      }

      if (
        !imports.length &&
        !(this as unknown as TransformPluginContext)._addedImports
      ) {
        importerModule.isSelfAccepting = false
        debug?.(
          `${timeFrom(msAtStart)} ${colors.dim(
            `[no imports] ${prettifyUrl(importer, root)}`,
          )}`,
        )
        return source
      }

      let hasHMR = false
      let isSelfAccepting = false
      let hasEnv = false
      let needQueryInjectHelper = false
      let s: MagicString | undefined
      const str = () => s || (s = new MagicString(source))
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
      ): Promise<[string, string | null]> => {
        url = stripBase(url, base)

        let importerFile = importer

        if (
          depsOptimizer &&
          moduleListContains(depsOptimizer.options.exclude, url)
        ) {
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

        const resolved = await this.resolve(url, importerFile).catch((e) => {
          if (e instanceof Error) {
            ;(e as RollupError).pos ??= pos
          }
          throw e
        })

        // NOTE: resolved.meta is undefined in dev
        if (!resolved || resolved.meta?.['vite:alias']?.noResolved) {
          // in ssr, we should let node handle the missing modules
          if (ssr) {
            return [url, null]
          }
          // fix#9534, prevent the importerModuleNode being stopped from propagating updates
          importerModule.isSelfAccepting = false
          moduleGraph._hasResolveFailedErrorModules.add(importerModule)
          return this.error(
            `Failed to resolve import "${url}" from "${normalizePath(
              path.relative(process.cwd(), importerFile),
            )}". Does the file exist?`,
            pos,
          )
        }

        if (isExternalUrl(resolved.id)) {
          return [resolved.id, resolved.id]
        }

        const isRelative = url[0] === '.'
        const isSelfImport = !isRelative && cleanUrl(url) === cleanUrl(importer)

        url = normalizeResolvedIdToUrl(environment, url, resolved)

        // make the URL browser-valid
        if (environment.config.consumer === 'client') {
          // mark non-js/css imports with `?import`
          if (isExplicitImportRequired(url)) {
            url = injectQuery(url, 'import')
          } else if (
            (isRelative || isSelfImport) &&
            !DEP_VERSION_RE.test(url)
          ) {
            // If the url isn't a request for a pre-bundled common chunk,
            // for relative js/css imports, or self-module virtual imports
            // (e.g. vue blocks), inherit importer's version query
            // do not do this for unknown type imports, otherwise the appended
            // query can break 3rd party plugin's extension checks.
            const versionMatch = DEP_VERSION_RE.exec(importer)
            if (versionMatch) {
              url = injectQuery(url, versionMatch[1])
            }
          }
        }

        try {
          // delay setting `isSelfAccepting` until the file is actually used (#7870)
          // We use an internal function to avoid resolving the url again
          const depModule = await moduleGraph._ensureEntryFromUrl(
            unwrapId(url),
            canSkipImportAnalysis(url) || forceSkipImportAnalysis,
            resolved,
          )
          // check if the dep has been hmr updated. If yes, we need to attach
          // its last updated timestamp to force the browser to fetch the most
          // up-to-date version of this module.
          if (
            environment.config.consumer === 'client' &&
            depModule.lastHMRTimestamp > 0
          ) {
            url = injectQuery(url, `t=${depModule.lastHMRTimestamp}`)
          }
        } catch (e: any) {
          // it's possible that the dep fails to resolve (non-existent import)
          // attach location to the missing import
          e.pos = pos
          throw e
        }

        // prepend base
        if (!ssr) url = joinUrlSegments(base, url)

        return [url, resolved.id]
      }

      const orderedImportedUrls = new Array<string | undefined>(imports.length)
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
            a: attributeIndex,
          } = importSpecifier

          // #2083 User may use escape path,
          // so use imports[index].n to get the unescaped string
          let specifier = importSpecifier.n

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
          } else if (templateLiteralRE.test(rawUrl)) {
            // If the import has backticks but isn't transformed as a glob import
            // (as there's nothing to glob), check if it's simply a plain string.
            // If so, we can replace the specifier as a plain string to prevent
            // an incorrect "cannot be analyzed" warning.
            if (!(rawUrl.includes('${') && rawUrl.includes('}'))) {
              specifier = rawUrl.replace(templateLiteralRE, '$1')
            }
          }

          const isDynamicImport = dynamicIndex > -1

          // strip import attributes as we can process them ourselves
          if (!isDynamicImport && attributeIndex > -1) {
            str().remove(end + 1, expEnd)
          }

          // static import or valid string in dynamic import
          // If resolvable, let's resolve it
          if (specifier !== undefined) {
            // skip external / data uri
            if (
              (isExternalUrl(specifier) && !specifier.startsWith('file://')) ||
              isDataUrl(specifier)
            ) {
              return
            }
            // skip ssr externals and builtins
            if (ssr && !matchAlias(specifier)) {
              if (shouldExternalize(environment, specifier, importer)) {
                return
              }
              if (isBuiltin(environment.config.resolve.builtins, specifier)) {
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
            let [url, resolvedId] = await normalizeUrl(specifier, start)
            resolvedId = resolvedId || url

            // record as safe modules
            // safeModulesPath should not include the base prefix.
            // See https://github.com/vitejs/vite/issues/9438#issuecomment-1465270409
            config.safeModulePaths.add(fsPathFromUrl(stripBase(url, base)))

            if (url !== specifier) {
              let rewriteDone = false
              if (
                depsOptimizer?.isOptimizedDepFile(resolvedId) &&
                !optimizedDepChunkRE.test(resolvedId)
              ) {
                // for optimized cjs deps, support named imports by rewriting named imports to const assignments.
                // internal optimized chunks don't need es interop and are excluded

                // The browserHash in resolvedId could be stale in which case there will be a full
                // page reload. We could return a 404 in that case but it is safe to return the request
                const file = cleanUrl(resolvedId) // Remove ?v={hash}

                const needsInterop = await optimizedDepNeedsInterop(
                  environment,
                  depsOptimizer.metadata,
                  file,
                )

                if (needsInterop === undefined) {
                  // Non-entry dynamic imports from dependencies will reach here as there isn't
                  // optimize info for them, but they don't need es interop. If the request isn't
                  // a dynamic import, then it is an internal Vite error
                  if (!optimizedDepDynamicRE.test(file)) {
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
              orderedImportedUrls[index] = hmrUrl
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
              environment.config.dev.preTransformRequests
            ) {
              // pre-transform known direct imports
              // These requests will also be registered in transformRequest to be awaited
              // by the deps optimizer
              const url = removeImportQuery(hmrUrl)
              environment.warmupRequest(url)
            }
          } else if (!importer.startsWith(withTrailingSlash(clientDir))) {
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
                    colors.reset(generateCodeFrame(source, start, end)) +
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
              if (
                !urlIsStringRE.test(rawUrl) ||
                isExplicitImportRequired(rawUrl.slice(1, -1))
              ) {
                needQueryInjectHelper = true
                str().overwrite(
                  start,
                  end,
                  `__vite__injectQuery(${rawUrl}, 'import')`,
                  { contentOnly: true },
                )
              }
            }
          }
        }),
      )

      const _orderedImportedUrls = orderedImportedUrls.filter(isDefined)
      const importedUrls = new Set(_orderedImportedUrls)
      // `importedUrls` will be mixed with watched files for the module graph,
      // `staticImportedUrls` will only contain the static top-level imports and
      // dynamic imports
      const staticImportedUrls = new Set(
        _orderedImportedUrls.map((url) => removeTimestampQuery(url)),
      )
      const acceptedUrls = mergeAcceptedUrls(orderedAcceptedUrls)
      const acceptedExports = mergeAcceptedUrls(orderedAcceptedExports)

      // While we always expect to work with ESM, a classic worker is the only
      // case where it's not ESM and we need to avoid injecting ESM-specific code
      const isClassicWorker =
        importer.includes(WORKER_FILE_ID) && importer.includes('type=classic')

      if (hasEnv && !isClassicWorker) {
        // inject import.meta.env
        str().prepend(getEnv(ssr))
      }

      if (hasHMR && !ssr && !isClassicWorker) {
        debugHmr?.(
          `${
            isSelfAccepting
              ? `[self-accepts]`
              : isPartiallySelfAccepting
                ? `[accepts-exports]`
                : acceptedUrls.size
                  ? `[accepts-deps]`
                  : `[detected api usage]`
          } ${prettifyUrl(importer, root)}`,
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
        if (isClassicWorker) {
          str().append('\n' + __vite__injectQuery.toString())
        } else {
          str().prepend(
            `import { injectQuery as __vite__injectQuery } from "${clientPublicPath}";`,
          )
        }
      }

      // normalize and rewrite accepted urls
      const normalizedAcceptedUrls = new Set<string>()
      for (const { url, start, end } of acceptedUrls) {
        let [normalized, resolvedId] = await normalizeUrl(url, start).catch(
          () => [],
        )
        if (resolvedId) {
          const mod = moduleGraph.getModuleById(resolvedId)
          if (!mod) {
            this.error(
              `module was not found for ${JSON.stringify(resolvedId)}`,
              start,
            )
            return
          }
          normalized = mod.url
        } else {
          try {
            // this fallback is for backward compat and will be removed in Vite 7
            const [resolved] = await moduleGraph.resolveUrl(toAbsoluteUrl(url))
            normalized = resolved
            if (resolved) {
              this.warn({
                message:
                  `Failed to resolve ${JSON.stringify(url)} from ${importer}.` +
                  ' An id should be written. Did you pass a URL?',
                pos: start,
              })
            }
          } catch {
            this.error(`Failed to resolve ${JSON.stringify(url)}`, start)
            return
          }
        }
        normalizedAcceptedUrls.add(normalized)
        const hmrAccept = normalizeHmrUrl(normalized)
        str().overwrite(start, end, JSON.stringify(hmrAccept), {
          contentOnly: true,
        })
      }

      // update the module graph for HMR analysis.
      // node CSS imports does its own graph update in the css-analysis plugin so we
      // only handle js graph updates here.
      // note that we want to handle .css?raw and .css?url here
      if (!isCSSRequest(importer) || SPECIAL_QUERY_RE.test(importer)) {
        // attached by pluginContainer.addWatchFile
        const pluginImports = (this as unknown as TransformPluginContext)
          ._addedImports
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
          staticImportedUrls,
        )
        if (hasHMR && prunedImports) {
          handlePrunedModules(prunedImports, environment)
        }
      }

      debug?.(
        `${timeFrom(msAtStart)} ${colors.dim(
          `[${importedUrls.size} imports rewritten] ${prettifyUrl(
            importer,
            root,
          )}`,
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

export function createParseErrorInfo(
  importer: string,
  source: string,
): { message: string; showCodeFrame: boolean } {
  const isVue = importer.endsWith('.vue')
  const isJsx = importer.endsWith('.jsx') || importer.endsWith('.tsx')
  const maybeJSX = !isVue && isJSRequest(importer)
  const probablyBinary = source.includes(
    '\ufffd' /* unicode replacement character */,
  )

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

  return {
    message:
      `Failed to parse source for import analysis because the content ` +
      `contains invalid JS syntax. ` +
      msg,
    showCodeFrame: !probablyBinary,
  }
}
// prettier-ignore
const interopHelper = (m: any) => m?.__esModule ? m : { ...(typeof m === 'object' && !Array.isArray(m) || typeof m === 'function' ? m : {}), default: m }

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
  const exp = source.slice(expStart, expEnd)
  if (dynamicIndex > -1) {
    // rewrite `import('package')` to expose the default directly
    str.overwrite(
      expStart,
      expEnd,
      `import('${rewrittenUrl}').then(m => (${interopHelper.toString()})(m.default))` +
        getLineBreaks(exp),
      { contentOnly: true },
    )
  } else {
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
      str.overwrite(expStart, expEnd, rewritten + getLineBreaks(exp), {
        contentOnly: true,
      })
    } else {
      // #1439 export * from '...'
      str.overwrite(
        start,
        end,
        rewrittenUrl + getLineBreaks(source.slice(start, end)),
        {
          contentOnly: true,
        },
      )
    }
  }
}

// get line breaks to preserve line count for not breaking source maps
function getLineBreaks(str: string) {
  return str.includes('\n') ? '\n'.repeat(str.split('\n').length - 1) : ''
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
  const node = parseAst(importExp).body[0]

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
      if (spec.type === 'ImportSpecifier') {
        const importedName = getIdentifierNameOrLiteralValue(
          spec.imported,
        ) as string
        const localName = spec.local.name
        importNames.push({ importedName, localName })
      } else if (spec.type === 'ImportDefaultSpecifier') {
        importNames.push({
          importedName: 'default',
          localName: spec.local.name,
        })
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        importNames.push({ importedName: '*', localName: spec.local.name })
      } else if (spec.type === 'ExportSpecifier') {
        // for ExportSpecifier, local name is same as imported name
        // prefix the variable name to avoid clashing with other local variables
        const importedName = getIdentifierNameOrLiteralValue(
          spec.local,
        ) as string
        // we want to specify exported name as variable and re-export it
        const exportedName = getIdentifierNameOrLiteralValue(
          spec.exported,
        ) as string
        if (exportedName === 'default') {
          defaultExports = makeLegalIdentifier(
            `__vite__cjsExportDefault_${importIndex}`,
          )
          importNames.push({ importedName, localName: defaultExports })
        } else {
          const localName = `__vite__cjsExport${
            spec.exported.type === 'Literal'
              ? `L_${getHash(spec.exported.value as string)}`
              : 'I_' + spec.exported.name
          }`
          importNames.push({ importedName, localName })
          exportNames.push(
            `${localName} as ${spec.exported.type === 'Literal' ? JSON.stringify(exportedName) : exportedName}`,
          )
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
        lines.push(
          `const ${localName} = (${interopHelper.toString()})(${cjsModuleName})`,
        )
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

function getIdentifierNameOrLiteralValue(node: Identifier | Literal) {
  return node.type === 'Identifier' ? node.name : node.value
}

// Copied from `client/client.ts`. Only needed so we can inline inject this function for classic workers.
function __vite__injectQuery(url: string, queryToInject: string): string {
  // skip urls that won't be handled by vite
  if (url[0] !== '.' && url[0] !== '/') {
    return url
  }

  // can't use pathname from URL since it may be relative like ../
  const pathname = url.replace(/[?#].*$/, '')
  const { search, hash } = new URL(url, 'http://vite.dev')

  return `${pathname}?${queryToInject}${search ? `&` + search.slice(1) : ''}${
    hash || ''
  }`
}
