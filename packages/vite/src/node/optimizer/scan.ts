import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { scan, transformSync } from 'rolldown/experimental'
import type { PartialResolvedId, Plugin } from 'rolldown'
import colors from 'picocolors'
import { glob } from 'tinyglobby'
import {
  CSS_LANGS_RE,
  JS_TYPES_RE,
  KNOWN_ASSET_TYPES,
  SPECIAL_QUERY_RE,
} from '../constants'
import {
  arraify,
  asyncFlatten,
  createDebugger,
  dataUrlRE,
  deepClone,
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
import type { EnvironmentPluginContainer } from '../server/pluginContainer'
import { createEnvironmentPluginContainer } from '../server/pluginContainer'
import { BaseEnvironment } from '../baseEnvironment'
import type { DevEnvironment } from '../server/environment'
import { transformGlobImport } from '../plugins/importMetaGlob'
import { cleanUrl } from '../../shared/utils'
import { getRollupJsxPresets } from '../plugins/oxc'

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
    this._pluginContainer = await createEnvironmentPluginContainer(
      this,
      this.plugins,
      undefined,
      false,
    )
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

const debug = createDebugger('vite:deps')

const htmlTypesRE = /\.(?:html|vue|svelte|astro|imba)$/

// A simple regex to detect import sources. This is only used on
// <script lang="ts"> blocks in vue (setup only) or svelte files, since
// seemingly unused imports are dropped by esbuild when transpiling TS which
// prevents it from crawling further.
// We can't use es-module-lexer because it can't handle TS, and don't want to
// use Acorn because it's slow. Luckily this doesn't have to be bullet proof
// since even missed imports can be caught at runtime, and false positives will
// simply be ignored.
export const importsRE: RegExp =
  /(?<!\/\/.*)(?<=^|;|\*\/)\s*import(?!\s+type)(?:[\w*{}\n\r\t, ]+from)?\s*("[^"]+"|'[^']+')\s*(?=$|;|\/\/|\/\*)/gm

export function scanImports(environment: ScanEnvironment): {
  cancel: () => Promise<void>
  result: Promise<{
    deps: Record<string, string>
    missing: Record<string, string>
  }>
} {
  const start = performance.now()
  const { config } = environment

  const scanContext = { cancelled: false }
  async function cancel() {
    scanContext.cancelled = true
  }

  async function scan() {
    const entries = await computeEntries(environment)
    if (!entries.length) {
      if (!config.optimizeDeps.entries && !config.optimizeDeps.include) {
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
    const deps: Record<string, string> = {}
    const missing: Record<string, string> = {}

    const context = await prepareRolldownScanner(
      environment,
      entries,
      deps,
      missing,
    )
    if (scanContext.cancelled) return

    try {
      await context.build()
      return {
        // Ensure a fixed order so hashes are stable and improve logs
        deps: orderedDependencies(deps),
        missing,
      }
    } catch (e) {
      const prependMessage = colors.red(`\
  Failed to scan for dependencies from entries:
  ${entries.join('\n')}

  `)
      e.message = prependMessage + e.message
      throw e
    } finally {
      if (debug) {
        const duration = (performance.now() - start).toFixed(2)
        const depsStr =
          Object.keys(orderedDependencies(deps))
            .sort()
            .map((id) => `\n  ${colors.cyan(id)} -> ${colors.dim(deps[id])}`)
            .join('') || colors.dim('no dependencies found')
        debug(`Scan completed in ${duration}ms: ${depsStr}`)
      }
    }
  }
  const result = scan()

  return {
    cancel,
    result: result.then((res) => res ?? { deps: {}, missing: {} }),
  }
}

async function computeEntries(environment: ScanEnvironment) {
  let entries: string[] = []

  const explicitEntryPatterns = environment.config.optimizeDeps.entries
  const buildInput = environment.config.build.rollupOptions.input

  if (explicitEntryPatterns) {
    entries = await globEntries(explicitEntryPatterns, environment)
  } else if (buildInput) {
    const resolvePath = async (p: string) => {
      // rollup resolves the input from process.cwd()
      const id = (
        await environment.pluginContainer.resolveId(
          p,
          path.join(process.cwd(), '*'),
          {
            isEntry: true,
            scan: true,
          },
        )
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
      isScannable(entry, environment.config.optimizeDeps.extensions) &&
      fs.existsSync(entry),
  )

  return entries
}

async function prepareRolldownScanner(
  environment: ScanEnvironment,
  entries: string[],
  deps: Record<string, string>,
  missing: Record<string, string>,
): Promise<{ build: () => Promise<void> }> {
  const { plugins: pluginsFromConfig = [], ...rolldownOptions } =
    environment.config.optimizeDeps.rolldownOptions ?? {}

  const plugins = await asyncFlatten(arraify(pluginsFromConfig))
  plugins.push(...rolldownScanPlugin(environment, deps, missing, entries))

  const transformOptions = deepClone(rolldownOptions.transform) ?? {}
  if (transformOptions.jsx === undefined) {
    transformOptions.jsx = {}
  } else if (
    transformOptions.jsx === 'react' ||
    transformOptions.jsx === 'react-jsx'
  ) {
    transformOptions.jsx = getRollupJsxPresets(transformOptions.jsx)
  }
  if (typeof transformOptions.jsx === 'object') {
    transformOptions.jsx.development ??= !environment.config.isProduction
  }

  async function build() {
    await scan({
      ...rolldownOptions,
      transform: transformOptions,
      input: entries,
      logLevel: 'silent',
      plugins,
    })
  }

  return { build }
}

function orderedDependencies(deps: Record<string, string>) {
  const depsList = Object.entries(deps)
  // Ensure the same browserHash for the same set of dependencies
  depsList.sort((a, b) => a[0].localeCompare(b[0]))
  return Object.fromEntries(depsList)
}

async function globEntries(
  patterns: string | string[],
  environment: ScanEnvironment,
) {
  const nodeModulesPatterns: string[] = []
  const regularPatterns: string[] = []

  for (const pattern of arraify(patterns)) {
    if (pattern.includes('node_modules')) {
      nodeModulesPatterns.push(pattern)
    } else {
      regularPatterns.push(pattern)
    }
  }

  const sharedOptions = {
    absolute: true,
    cwd: environment.config.root,
    ignore: [
      `**/${environment.config.build.outDir}/**`,
      // if there aren't explicit entries, also ignore other common folders
      ...(environment.config.optimizeDeps.entries
        ? []
        : [`**/__tests__/**`, `**/coverage/**`]),
    ],
  }

  const results = await Promise.all([
    glob(nodeModulesPatterns, sharedOptions),
    glob(regularPatterns, {
      ...sharedOptions,
      ignore: [...sharedOptions.ignore, '**/node_modules/**'],
    }),
  ])

  return results.flat()
}

type Loader = 'js' | 'ts' | 'jsx' | 'tsx'

export const scriptRE: RegExp =
  /(<script(?:\s+[a-z_:][-\w:]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^"'<>=\s]+))?)*\s*>)(.*?)<\/script>/gis
export const commentRE: RegExp = /<!--.*?-->/gs
const srcRE = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i
const typeRE = /\btype\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i
const langRE = /\blang\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i
const svelteScriptModuleRE =
  /\bcontext\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s'">]+))/i
const svelteModuleRE = /\smodule\b/i

function rolldownScanPlugin(
  environment: ScanEnvironment,
  depImports: Record<string, string>,
  missing: Record<string, string>,
  entries: string[],
): Plugin[] {
  const seen = new Map<string, string | undefined>()
  async function resolveId(
    id: string,
    importer?: string,
  ): Promise<PartialResolvedId | null> {
    return environment.pluginContainer.resolveId(
      id,
      importer && normalizePath(importer),
      { scan: true },
    )
  }
  const resolve = async (id: string, importer?: string) => {
    const key = id + (importer && path.dirname(importer))
    if (seen.has(key)) {
      return seen.get(key)
    }
    const resolved = await resolveId(id, importer)
    const res = resolved?.id
    seen.set(key, res)
    return res
  }

  const optimizeDepsOptions = environment.config.optimizeDeps
  const include = optimizeDepsOptions.include
  const exclude = [
    ...(optimizeDepsOptions.exclude ?? []),
    '@vite/client',
    '@vite/env',
  ]

  const externalUnlessEntry = ({ path }: { path: string }) => ({
    id: path,
    external: !entries.includes(path),
  })

  const doTransformGlobImport = async (
    contents: string,
    id: string,
    loader: Loader,
  ) => {
    let transpiledContents: string
    // transpile because `transformGlobImport` only expects js
    if (loader !== 'js') {
      const result = transformSync(id, contents, { lang: loader })
      if (result.errors.length > 0) {
        throw new AggregateError(result.errors, 'oxc transform error')
      }
      transpiledContents = result.code
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

  const scripts: Record<
    string,
    {
      contents: string
      loader: Loader
    }
  > = {}

  const htmlTypeOnLoadCallback = async (id: string): Promise<string> => {
    let raw = await fsp.readFile(id, 'utf-8')
    // Avoid matching the content of the comment
    raw = raw.replace(commentRE, '<!---->')
    const isHtml = id.endsWith('.html')
    let js = ''
    let scriptId = 0
    const matches = raw.matchAll(scriptRE)
    for (const [, openTag, content] of matches) {
      const typeMatch = typeRE.exec(openTag)
      const type = typeMatch && (typeMatch[1] || typeMatch[2] || typeMatch[3])
      const langMatch = langRE.exec(openTag)
      const lang = langMatch && (langMatch[1] || langMatch[2] || langMatch[3])
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
      } else if (id.endsWith('.astro')) {
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
          content + (loader.startsWith('ts') ? extractImportPaths(content) : '')

        const key = `${id}?id=${scriptId++}`
        if (contents.includes('import.meta.glob')) {
          scripts[key] = {
            loader: 'js', // since it is transpiled
            contents: await doTransformGlobImport(contents, id, loader),
          }
        } else {
          scripts[key] = {
            loader,
            contents,
          }
        }

        const virtualModulePath = JSON.stringify(virtualModulePrefix + key)

        let addedImport = false

        // For Svelte files, exports in <script context="module"> or <script module> means module exports,
        // exports in <script> means component props. To avoid having two same export name from the
        // star exports, we need to ignore exports in <script>
        if (id.endsWith('.svelte')) {
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
    if (!id.endsWith('.vue') || !js.includes('export default')) {
      js += '\nexport default {}'
    }

    return js
  }

  const ASSET_TYPE_RE = new RegExp(`\\.(${KNOWN_ASSET_TYPES.join('|')})$`)

  return [
    {
      name: 'vite:dep-scan:resolve-external-url',
      resolveId: {
        // external urls
        filter: { id: externalRE },
        handler: (id) => ({ id, external: true }),
      },
    },
    {
      name: 'vite:dep-scan:resolve-data-url',
      resolveId: {
        // data urls
        filter: { id: dataUrlRE },
        handler: (id) => ({ id, external: true }),
      },
    },
    {
      // local scripts (`<script>` in Svelte and `<script setup>` in Vue)
      name: 'vite:dep-scan:local-scripts',
      resolveId: {
        filter: { id: virtualModuleRE },
        handler: (id) => ({ id }),
      },
      load: {
        filter: { id: virtualModuleRE },
        handler(id) {
          const script = scripts[id.replace(virtualModulePrefix, '')]
          return {
            code: script.contents,
            moduleType: script.loader,
          }
        },
      },
    },

    {
      name: 'vite:dep-scan:resolve',
      async resolveId(id, importer) {
        // Make sure virtual module importer can be resolve
        importer =
          importer && virtualModuleRE.test(importer)
            ? importer.replace(virtualModulePrefix, '')
            : importer

        // html types: extract script contents -----------------------------------
        if (htmlTypesRE.test(id)) {
          const resolved = await resolve(id, importer)
          if (!resolved) return
          // It is possible for the scanner to scan html types in node_modules.
          // If we can optimize this html type, skip it so it's handled by the
          // bare import resolve, and recorded as optimization dep.
          if (
            isInNodeModules(resolved) &&
            isOptimizable(resolved, optimizeDepsOptions)
          )
            return
          if (shouldExternalizeDep(resolved, id)) {
            return externalUnlessEntry({ path: id })
          }
          return resolved
        }

        // bare imports: record and externalize ----------------------------------
        // avoid matching windows volume
        if (/^[\w@][^:]/.test(id)) {
          if (moduleListContains(exclude, id)) {
            return externalUnlessEntry({ path: id })
          }
          if (depImports[id]) {
            return externalUnlessEntry({ path: id })
          }
          const resolved = await resolve(id, importer)
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
              // linked package, keep crawling
              return path.resolve(resolved)
            } else {
              return externalUnlessEntry({ path: id })
            }
          } else {
            missing[id] = normalizePath(importer!)
          }
        }

        // Externalized file types -----------------------------------------------
        // these are done on raw ids using esbuild's native regex filter so it
        // should be faster than doing it in the catch-all via js
        // they are done after the bare import resolve because a package name
        // may end with these extensions

        // css
        if (CSS_LANGS_RE.test(id)) {
          return externalUnlessEntry({ path: id })
        }

        // json & wasm
        if (/\.(?:json|json5|wasm)$/.test(id)) {
          return externalUnlessEntry({ path: id })
        }

        // known asset types
        if (ASSET_TYPE_RE.test(id)) {
          return externalUnlessEntry({ path: id })
        }

        // known vite query types: ?worker, ?raw
        if (SPECIAL_QUERY_RE.test(id)) {
          return {
            id,
            external: true,
          }
        }

        // catch all -------------------------------------------------------------

        // use vite resolver to support urls and omitted extensions
        const resolved = await resolve(id, importer)
        if (resolved) {
          if (
            shouldExternalizeDep(resolved, id) ||
            !isScannable(resolved, optimizeDepsOptions.extensions)
          ) {
            return externalUnlessEntry({ path: id })
          }
          return path.resolve(cleanUrl(resolved))
        }

        // resolve failed... probably unsupported type
        return externalUnlessEntry({ path: id })
      },
    },
    {
      name: 'vite:dep-scan:load:html',
      load: {
        // extract scripts inside HTML-like files and treat it as a js module
        filter: { id: htmlTypesRE },
        async handler(id) {
          return {
            code: await htmlTypeOnLoadCallback(id),
            moduleType: 'js',
          }
        },
      },
    },
    // for jsx/tsx, we need to access the content and check for
    // presence of import.meta.glob, since it results in import relationships
    // but isn't crawled by esbuild.
    ...(environment.config.esbuild && environment.config.esbuild.jsxInject
      ? [
          {
            name: 'vite:dep-scan:transform:jsx-inject',
            transform: {
              filter: {
                id: /\.[jt]sx$/,
              },
              handler(code) {
                const esbuildConfig = environment.config.esbuild
                if (esbuildConfig && esbuildConfig.jsxInject) {
                  code = esbuildConfig.jsxInject + `\n` + code
                }
                return code
              },
            },
          } satisfies Plugin,
        ]
      : []),
    {
      name: 'vite:dep-scan:transform:js-glob',
      transform: {
        filter: {
          code: 'import.meta.glob',
        },
        async handler(code, id) {
          if (JS_TYPES_RE.test(id)) {
            let ext = path.extname(id).slice(1)
            if (ext === 'mjs') ext = 'js'
            const loader = ext as 'js' | 'ts' | 'jsx' | 'tsx'
            return {
              moduleType: 'js',
              code: await doTransformGlobImport(code, id, loader),
            }
          }
        },
      },
    },
  ]
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
