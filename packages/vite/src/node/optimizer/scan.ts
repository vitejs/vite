import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import type {
  BuildContext,
  Loader,
  OnLoadArgs,
  OnLoadResult,
  Plugin,
} from 'esbuild'
import esbuild, { formatMessages, transform } from 'esbuild'
import type { PartialResolvedId } from 'rollup'
import colors from 'picocolors'
import { glob, isDynamicPattern } from 'tinyglobby'
import {
  CSS_LANGS_RE,
  JS_TYPES_RE,
  KNOWN_ASSET_TYPES,
  SPECIAL_QUERY_RE,
} from '../constants'
import {
  arraify,
  createDebugger,
  dataUrlRE,
  externalRE,
  isInNodeModules,
  isObject,
  isOptimizable,
  moduleListContains,
  multilineCommentsRE,
  normalizePath,
  singlelineCommentsRE,
  virtualModulePrefix,
  virtualModuleRE,
} from '../utils'
import { resolveEnvironmentPlugins } from '../plugin'
import type { EnvironmentPluginContainer } from '../server/pluginContainer'
import { createEnvironmentPluginContainer } from '../server/pluginContainer'
import { BaseEnvironment } from '../baseEnvironment'
import type { DevEnvironment } from '../server/environment'
import { transformGlobImport } from '../plugins/importMetaGlob'
import { cleanUrl } from '../../shared/utils'
import { loadTsconfigJsonForFile } from '../plugins/esbuild'

export class ScanEnvironment extends BaseEnvironment {
  mode = 'scan' as const

  get pluginContainer(): EnvironmentPluginContainer {
    if (!this._pluginContainer)
      throw new Error(
        `${this.name} environment.pluginContainer called before initialized`,
      )
    return this._pluginContainer
  }
  /**
   * @internal
   */
  _pluginContainer: EnvironmentPluginContainer | undefined

  async init(): Promise<void> {
    if (this._initiated) {
      return
    }
    this._initiated = true
    this._plugins = resolveEnvironmentPlugins(this)
    this._pluginContainer = await createEnvironmentPluginContainer(
      this,
      this.plugins,
    )
    await this._pluginContainer.buildStart()
  }
}

// Restrict access to the module graph and the server while scanning
export function devToScanEnvironment(
  environment: DevEnvironment,
): ScanEnvironment {
  return {
    mode: 'scan',
    get name() {
      return environment.name
    },
    getTopLevelConfig() {
      return environment.getTopLevelConfig()
    },
    /**
     * @deprecated use environment.config instead
     **/
    get options() {
      return environment.options
    },
    get config() {
      return environment.config
    },
    get logger() {
      return environment.logger
    },
    get pluginContainer() {
      return environment.pluginContainer
    },
    get plugins() {
      return environment.plugins
    },
  } as unknown as ScanEnvironment
}

type ResolveIdOptions = Omit<
  Parameters<EnvironmentPluginContainer['resolveId']>[2],
  'environment'
>

const debug = createDebugger('vite:deps')

const htmlTypesRE = /\.(html|vue|svelte|astro|imba)$/

// A simple regex to detect import sources. This is only used on
// <script lang="ts"> blocks in vue (setup only) or svelte files, since
// seemingly unused imports are dropped by esbuild when transpiling TS which
// prevents it from crawling further.
// We can't use es-module-lexer because it can't handle TS, and don't want to
// use Acorn because it's slow. Luckily this doesn't have to be bullet proof
// since even missed imports can be caught at runtime, and false positives will
// simply be ignored.
export const importsRE =
  /(?<!\/\/.*)(?<=^|;|\*\/)\s*import(?!\s+type)(?:[\w*{}\n\r\t, ]+from)?\s*("[^"]+"|'[^']+')\s*(?=$|;|\/\/|\/\*)/gm

export function scanImports(environment: ScanEnvironment): {
  cancel: () => Promise<void>
  result: Promise<{
    deps: Record<string, string>
    missing: Record<string, string>
  }>
} {
  // Only used to scan non-ssr code

  const start = performance.now()
  const deps: Record<string, string> = {}
  const missing: Record<string, string> = {}
  let entries: string[]

  const { config } = environment
  const scanContext = { cancelled: false }
  const esbuildContext: Promise<BuildContext | undefined> = computeEntries(
    environment,
  ).then((computedEntries) => {
    entries = computedEntries

    if (!entries.length) {
      if (!config.optimizeDeps.entries && !config.dev.optimizeDeps.include) {
        environment.logger.warn(
          colors.yellow(
            '(!) Could not auto-determine entry point from rollupOptions or html files ' +
              'and there are no explicit optimizeDeps.include patterns. ' +
              'Skipping dependency pre-bundling.',
          ),
        )
      }
      return
    }
    if (scanContext.cancelled) return

    debug?.(
      `Crawling dependencies using entries: ${entries
        .map((entry) => `\n  ${colors.dim(entry)}`)
        .join('')}`,
    )
    return prepareEsbuildScanner(
      environment,
      entries,
      deps,
      missing,
      scanContext,
    )
  })

  const result = esbuildContext
    .then((context) => {
      function disposeContext() {
        return context?.dispose().catch((e) => {
          environment.logger.error('Failed to dispose esbuild context', {
            error: e,
          })
        })
      }
      if (!context || scanContext?.cancelled) {
        disposeContext()
        return { deps: {}, missing: {} }
      }
      return context
        .rebuild()
        .then(() => {
          return {
            // Ensure a fixed order so hashes are stable and improve logs
            deps: orderedDependencies(deps),
            missing,
          }
        })
        .finally(() => {
          return disposeContext()
        })
    })
    .catch(async (e) => {
      if (e.errors && e.message.includes('The build was canceled')) {
        // esbuild logs an error when cancelling, but this is expected so
        // return an empty result instead
        return { deps: {}, missing: {} }
      }

      const prependMessage = colors.red(`\
  Failed to scan for dependencies from entries:
  ${entries.join('\n')}

  `)
      if (e.errors) {
        const msgs = await formatMessages(e.errors, {
          kind: 'error',
          color: true,
        })
        e.message = prependMessage + msgs.join('\n')
      } else {
        e.message = prependMessage + e.message
      }
      throw e
    })
    .finally(() => {
      if (debug) {
        const duration = (performance.now() - start).toFixed(2)
        const depsStr =
          Object.keys(orderedDependencies(deps))
            .sort()
            .map((id) => `\n  ${colors.cyan(id)} -> ${colors.dim(deps[id])}`)
            .join('') || colors.dim('no dependencies found')
        debug(`Scan completed in ${duration}ms: ${depsStr}`)
      }
    })

  return {
    cancel: async () => {
      scanContext.cancelled = true
      return esbuildContext.then((context) => context?.cancel())
    },
    result,
  }
}

async function computeEntries(environment: ScanEnvironment) {
  let entries: string[] = []

  const explicitEntryPatterns = environment.config.dev.optimizeDeps.entries
  const buildInput = environment.config.build.rollupOptions?.input

  if (explicitEntryPatterns) {
    entries = await globEntries(explicitEntryPatterns, environment)
  } else if (buildInput) {
    const resolvePath = async (p: string) => {
      const id = (
        await environment.pluginContainer.resolveId(p, undefined, {
          scan: true,
        })
      )?.id
      if (id === undefined) {
        throw new Error(
          `failed to resolve rollupOptions.input value: ${JSON.stringify(p)}.`,
        )
      }
      return id
    }
    if (typeof buildInput === 'string') {
      entries = [await resolvePath(buildInput)]
    } else if (Array.isArray(buildInput)) {
      entries = await Promise.all(buildInput.map(resolvePath))
    } else if (isObject(buildInput)) {
      entries = await Promise.all(Object.values(buildInput).map(resolvePath))
    } else {
      throw new Error('invalid rollupOptions.input value.')
    }
  } else {
    entries = await globEntries('**/*.html', environment)
  }

  // Non-supported entry file types and virtual files should not be scanned for
  // dependencies.
  entries = entries.filter(
    (entry) =>
      isScannable(entry, environment.config.dev.optimizeDeps.extensions) &&
      fs.existsSync(entry),
  )

  return entries
}

async function prepareEsbuildScanner(
  environment: ScanEnvironment,
  entries: string[],
  deps: Record<string, string>,
  missing: Record<string, string>,
  scanContext?: { cancelled: boolean },
): Promise<BuildContext | undefined> {
  if (scanContext?.cancelled) return

  const plugin = esbuildScanPlugin(environment, deps, missing, entries)

  const { plugins = [], ...esbuildOptions } =
    environment.config.dev.optimizeDeps.esbuildOptions ?? {}

  // The plugin pipeline automatically loads the closest tsconfig.json.
  // But esbuild doesn't support reading tsconfig.json if the plugin has resolved the path (https://github.com/evanw/esbuild/issues/2265).
  // Due to syntax incompatibilities between the experimental decorators in TypeScript and TC39 decorators,
  // we cannot simply set `"experimentalDecorators": true` or `false`. (https://github.com/vitejs/vite/pull/15206#discussion_r1417414715)
  // Therefore, we use the closest tsconfig.json from the root to make it work in most cases.
  let tsconfigRaw = esbuildOptions.tsconfigRaw
  if (!tsconfigRaw && !esbuildOptions.tsconfig) {
    const tsconfigResult = await loadTsconfigJsonForFile(
      path.join(environment.config.root, '_dummy.js'),
    )
    if (tsconfigResult.compilerOptions?.experimentalDecorators) {
      tsconfigRaw = { compilerOptions: { experimentalDecorators: true } }
    }
  }

  return await esbuild.context({
    absWorkingDir: process.cwd(),
    write: false,
    stdin: {
      contents: entries.map((e) => `import ${JSON.stringify(e)}`).join('\n'),
      loader: 'js',
    },
    bundle: true,
    format: 'esm',
    logLevel: 'silent',
    plugins: [...plugins, plugin],
    ...esbuildOptions,
    tsconfigRaw,
  })
}

function orderedDependencies(deps: Record<string, string>) {
  const depsList = Object.entries(deps)
  // Ensure the same browserHash for the same set of dependencies
  depsList.sort((a, b) => a[0].localeCompare(b[0]))
  return Object.fromEntries(depsList)
}

function globEntries(pattern: string | string[], environment: ScanEnvironment) {
  const resolvedPatterns = arraify(pattern)
  if (resolvedPatterns.every((str) => !isDynamicPattern(str))) {
    return resolvedPatterns.map((p) =>
      normalizePath(path.resolve(environment.config.root, p)),
    )
  }
  return glob(pattern, {
    absolute: true,
    cwd: environment.config.root,
    ignore: [
      '**/node_modules/**',
      `**/${environment.config.build.outDir}/**`,
      // if there aren't explicit entries, also ignore other common folders
      ...(environment.config.dev.optimizeDeps.entries
        ? []
        : [`**/__tests__/**`, `**/coverage/**`]),
    ],
  })
}

export const scriptRE =
  /(<script(?:\s+[a-z_:][-\w:]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^"'<>=\s]+))?)*\s*>)(.*?)<\/script>/gis
export const commentRE = /<!--.*?-->/gs
const srcRE = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i
const typeRE = /\btype\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i
const langRE = /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i
const svelteScriptModuleRE =
  /\bcontext\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i
const svelteModuleRE = /\smodule\b/i

function esbuildScanPlugin(
  environment: ScanEnvironment,
  depImports: Record<string, string>,
  missing: Record<string, string>,
  entries: string[],
): Plugin {
  const seen = new Map<string, string | undefined>()
  async function resolveId(
    id: string,
    importer?: string,
    options?: ResolveIdOptions,
  ): Promise<PartialResolvedId | null> {
    return environment.pluginContainer.resolveId(
      id,
      importer && normalizePath(importer),
      {
        ...options,
        scan: true,
      },
    )
  }
  const resolve = async (
    id: string,
    importer?: string,
    options?: ResolveIdOptions,
  ) => {
    const key = id + (importer && path.dirname(importer))
    if (seen.has(key)) {
      return seen.get(key)
    }
    const resolved = await resolveId(id, importer, options)
    const res = resolved?.id
    seen.set(key, res)
    return res
  }

  const optimizeDepsOptions = environment.config.dev.optimizeDeps
  const include = optimizeDepsOptions.include
  const exclude = [
    ...(optimizeDepsOptions.exclude ?? []),
    '@vite/client',
    '@vite/env',
  ]

  const isUnlessEntry = (path: string) => !entries.includes(path)

  const externalUnlessEntry = ({ path }: { path: string }) => ({
    path,
    external: isUnlessEntry(path),
  })

  const doTransformGlobImport = async (
    contents: string,
    id: string,
    loader: Loader,
  ) => {
    let transpiledContents
    // transpile because `transformGlobImport` only expects js
    if (loader !== 'js') {
      transpiledContents = (await transform(contents, { loader })).code
    } else {
      transpiledContents = contents
    }

    const result = await transformGlobImport(
      transpiledContents,
      id,
      environment.config.root,
      resolve,
    )

    return result?.s.toString() || transpiledContents
  }

  return {
    name: 'vite:dep-scan',
    setup(build) {
      const scripts: Record<string, OnLoadResult> = {}

      // external urls
      build.onResolve({ filter: externalRE }, ({ path }) => ({
        path,
        external: true,
      }))

      // data urls
      build.onResolve({ filter: dataUrlRE }, ({ path }) => ({
        path,
        external: true,
      }))

      // local scripts (`<script>` in Svelte and `<script setup>` in Vue)
      build.onResolve({ filter: virtualModuleRE }, ({ path }) => {
        return {
          // strip prefix to get valid filesystem path so esbuild can resolve imports in the file
          path: path.replace(virtualModulePrefix, ''),
          namespace: 'script',
        }
      })

      build.onLoad({ filter: /.*/, namespace: 'script' }, ({ path }) => {
        return scripts[path]
      })

      // html types: extract script contents -----------------------------------
      build.onResolve({ filter: htmlTypesRE }, async ({ path, importer }) => {
        const resolved = await resolve(path, importer)
        if (!resolved) return
        // It is possible for the scanner to scan html types in node_modules.
        // If we can optimize this html type, skip it so it's handled by the
        // bare import resolve, and recorded as optimization dep.
        if (
          isInNodeModules(resolved) &&
          isOptimizable(resolved, optimizeDepsOptions)
        )
          return
        return {
          path: resolved,
          namespace: 'html',
        }
      })

      const htmlTypeOnLoadCallback: (
        args: OnLoadArgs,
      ) => Promise<OnLoadResult | null | undefined> = async ({ path: p }) => {
        let raw = await fsp.readFile(p, 'utf-8')
        // Avoid matching the content of the comment
        raw = raw.replace(commentRE, '<!---->')
        const isHtml = p.endsWith('.html')
        let js = ''
        let scriptId = 0
        const matches = raw.matchAll(scriptRE)
        for (const [, openTag, content] of matches) {
          const typeMatch = typeRE.exec(openTag)
          const type =
            typeMatch && (typeMatch[1] || typeMatch[2] || typeMatch[3])
          const langMatch = langRE.exec(openTag)
          const lang =
            langMatch && (langMatch[1] || langMatch[2] || langMatch[3])
          // skip non type module script
          if (isHtml && type !== 'module') {
            continue
          }
          // skip type="application/ld+json" and other non-JS types
          if (
            type &&
            !(
              type.includes('javascript') ||
              type.includes('ecmascript') ||
              type === 'module'
            )
          ) {
            continue
          }
          let loader: Loader = 'js'
          if (lang === 'ts' || lang === 'tsx' || lang === 'jsx') {
            loader = lang
          } else if (p.endsWith('.astro')) {
            loader = 'ts'
          }
          const srcMatch = srcRE.exec(openTag)
          if (srcMatch) {
            const src = srcMatch[1] || srcMatch[2] || srcMatch[3]
            js += `import ${JSON.stringify(src)}\n`
          } else if (content.trim()) {
            // The reason why virtual modules are needed:
            // 1. There can be module scripts (`<script context="module">` in Svelte and `<script>` in Vue)
            // or local scripts (`<script>` in Svelte and `<script setup>` in Vue)
            // 2. There can be multiple module scripts in html
            // We need to handle these separately in case variable names are reused between them

            // append imports in TS to prevent esbuild from removing them
            // since they may be used in the template
            const contents =
              content +
              (loader.startsWith('ts') ? extractImportPaths(content) : '')

            const key = `${p}?id=${scriptId++}`
            if (contents.includes('import.meta.glob')) {
              scripts[key] = {
                loader: 'js', // since it is transpiled
                contents: await doTransformGlobImport(contents, p, loader),
                resolveDir: normalizePath(path.dirname(p)),
                pluginData: {
                  htmlType: { loader },
                },
              }
            } else {
              scripts[key] = {
                loader,
                contents,
                resolveDir: normalizePath(path.dirname(p)),
                pluginData: {
                  htmlType: { loader },
                },
              }
            }

            const virtualModulePath = JSON.stringify(virtualModulePrefix + key)

            let addedImport = false

            // For Svelte files, exports in <script context="module"> or <script module> means module exports,
            // exports in <script> means component props. To avoid having two same export name from the
            // star exports, we need to ignore exports in <script>
            if (p.endsWith('.svelte')) {
              let isModule = svelteModuleRE.test(openTag) // test for svelte5 <script module> syntax
              if (!isModule) {
                // fallback, test for svelte4 <script context="module"> syntax
                const contextMatch = svelteScriptModuleRE.exec(openTag)
                const context =
                  contextMatch &&
                  (contextMatch[1] || contextMatch[2] || contextMatch[3])
                isModule = context === 'module'
              }
              if (!isModule) {
                addedImport = true
                js += `import ${virtualModulePath}\n`
              }
            }

            if (!addedImport) {
              js += `export * from ${virtualModulePath}\n`
            }
          }
        }

        // This will trigger incorrectly if `export default` is contained
        // anywhere in a string. Svelte and Astro files can't have
        // `export default` as code so we know if it's encountered it's a
        // false positive (e.g. contained in a string)
        if (!p.endsWith('.vue') || !js.includes('export default')) {
          js += '\nexport default {}'
        }

        return {
          loader: 'js',
          contents: js,
        }
      }

      // extract scripts inside HTML-like files and treat it as a js module
      build.onLoad(
        { filter: htmlTypesRE, namespace: 'html' },
        htmlTypeOnLoadCallback,
      )
      // the onResolve above will use namespace=html but esbuild doesn't
      // call onResolve for glob imports and those will use namespace=file
      // https://github.com/evanw/esbuild/issues/3317
      build.onLoad(
        { filter: htmlTypesRE, namespace: 'file' },
        htmlTypeOnLoadCallback,
      )

      // bare imports: record and externalize ----------------------------------
      build.onResolve(
        {
          // avoid matching windows volume
          filter: /^[\w@][^:]/,
        },
        async ({ path: id, importer, pluginData }) => {
          if (moduleListContains(exclude, id)) {
            return externalUnlessEntry({ path: id })
          }
          if (depImports[id]) {
            return externalUnlessEntry({ path: id })
          }
          const resolved = await resolve(id, importer, {
            custom: {
              depScan: { loader: pluginData?.htmlType?.loader },
            },
          })
          if (resolved) {
            if (shouldExternalizeDep(resolved, id)) {
              return externalUnlessEntry({ path: id })
            }
            if (isInNodeModules(resolved) || include?.includes(id)) {
              // dependency or forced included, externalize and stop crawling
              if (isOptimizable(resolved, optimizeDepsOptions)) {
                depImports[id] = resolved
              }
              return externalUnlessEntry({ path: id })
            } else if (isScannable(resolved, optimizeDepsOptions.extensions)) {
              const namespace = htmlTypesRE.test(resolved) ? 'html' : undefined
              // linked package, keep crawling
              return {
                path: path.resolve(resolved),
                namespace,
              }
            } else {
              return externalUnlessEntry({ path: id })
            }
          } else {
            missing[id] = normalizePath(importer)
          }
        },
      )

      // Externalized file types -----------------------------------------------
      // these are done on raw ids using esbuild's native regex filter so it
      // should be faster than doing it in the catch-all via js
      // they are done after the bare import resolve because a package name
      // may end with these extensions
      const setupExternalize = (
        filter: RegExp,
        doExternalize: (path: string) => boolean,
      ) => {
        build.onResolve({ filter }, ({ path }) => {
          return {
            path,
            external: doExternalize(path),
          }
        })
      }

      // css
      setupExternalize(CSS_LANGS_RE, isUnlessEntry)
      // json & wasm
      setupExternalize(/\.(json|json5|wasm)$/, isUnlessEntry)
      // known asset types
      setupExternalize(
        new RegExp(`\\.(${KNOWN_ASSET_TYPES.join('|')})$`),
        isUnlessEntry,
      )
      // known vite query types: ?worker, ?raw
      setupExternalize(SPECIAL_QUERY_RE, () => true)

      // catch all -------------------------------------------------------------

      build.onResolve(
        {
          filter: /.*/,
        },
        async ({ path: id, importer, pluginData }) => {
          // use vite resolver to support urls and omitted extensions
          const resolved = await resolve(id, importer, {
            custom: {
              depScan: { loader: pluginData?.htmlType?.loader },
            },
          })
          if (resolved) {
            if (
              shouldExternalizeDep(resolved, id) ||
              !isScannable(resolved, optimizeDepsOptions.extensions)
            ) {
              return externalUnlessEntry({ path: id })
            }

            const namespace = htmlTypesRE.test(resolved) ? 'html' : undefined

            return {
              path: path.resolve(cleanUrl(resolved)),
              namespace,
            }
          } else {
            // resolve failed... probably unsupported type
            return externalUnlessEntry({ path: id })
          }
        },
      )

      // for jsx/tsx, we need to access the content and check for
      // presence of import.meta.glob, since it results in import relationships
      // but isn't crawled by esbuild.
      build.onLoad({ filter: JS_TYPES_RE }, async ({ path: id }) => {
        let ext = path.extname(id).slice(1)
        if (ext === 'mjs') ext = 'js'

        const esbuildConfig = environment.config.esbuild
        let contents = await fsp.readFile(id, 'utf-8')
        if (ext.endsWith('x') && esbuildConfig && esbuildConfig.jsxInject) {
          contents = esbuildConfig.jsxInject + `\n` + contents
        }

        const loader =
          optimizeDepsOptions.esbuildOptions?.loader?.[`.${ext}`] ??
          (ext as Loader)

        if (contents.includes('import.meta.glob')) {
          return {
            loader: 'js', // since it is transpiled,
            contents: await doTransformGlobImport(contents, id, loader),
          }
        }

        return {
          loader,
          contents,
        }
      })

      // onResolve is not called for glob imports.
      // we need to add that here as well until esbuild calls onResolve for glob imports.
      // https://github.com/evanw/esbuild/issues/3317
      build.onLoad({ filter: /.*/, namespace: 'file' }, () => {
        return {
          loader: 'js',
          contents: 'export default {}',
        }
      })
    },
  }
}

/**
 * when using TS + (Vue + `<script setup>`) or Svelte, imports may seem
 * unused to esbuild and dropped in the build output, which prevents
 * esbuild from crawling further.
 * the solution is to add `import 'x'` for every source to force
 * esbuild to keep crawling due to potential side effects.
 */
function extractImportPaths(code: string) {
  // empty singleline & multiline comments to avoid matching comments
  code = code
    .replace(multilineCommentsRE, '/* */')
    .replace(singlelineCommentsRE, '')

  let js = ''
  let m
  importsRE.lastIndex = 0
  while ((m = importsRE.exec(code)) != null) {
    js += `\nimport ${m[1]}`
  }
  return js
}

function shouldExternalizeDep(resolvedId: string, rawId: string): boolean {
  // not a valid file path
  if (!path.isAbsolute(resolvedId)) {
    return true
  }
  // virtual id
  if (resolvedId === rawId || resolvedId.includes('\0')) {
    return true
  }
  return false
}

function isScannable(id: string, extensions: string[] | undefined): boolean {
  return (
    JS_TYPES_RE.test(id) ||
    htmlTypesRE.test(id) ||
    extensions?.includes(path.extname(id)) ||
    false
  )
}
