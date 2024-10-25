/* eslint-disable n/no-extraneous-import */
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { build, normalizePath } from 'vite'
import MagicString from 'magic-string'
import type {
  BuildOptions,
  HtmlTagDescriptor,
  Plugin,
  ResolvedConfig,
} from 'vite'
import type {
  NormalizedOutputOptions,
  OutputAsset,
  OutputBundle,
  OutputChunk,
  OutputOptions,
  PreRenderedChunk,
  RenderedChunk,
} from 'rollup'
import type {
  PluginItem as BabelPlugin,
  types as BabelTypes,
} from '@babel/core'
import colors from 'picocolors'
import browserslist from 'browserslist'
import type { Options } from './types'
import {
  detectModernBrowserCode,
  dynamicFallbackInlineCode,
  legacyEntryId,
  legacyPolyfillId,
  modernChunkLegacyGuard,
  safari10NoModuleFix,
  systemJSInlineCode,
} from './snippets'

// lazy load babel since it's not used during dev
let babel: typeof import('@babel/core') | undefined
async function loadBabel() {
  if (!babel) {
    babel = await import('@babel/core')
  }
  return babel
}

// The requested module 'browserslist' is a CommonJS module
// which may not support all module.exports as named exports
const { loadConfig: browserslistLoadConfig } = browserslist

// Duplicated from build.ts in Vite Core, at least while the feature is experimental
// We should later expose this helper for other plugins to use
function toOutputFilePathInHtml(
  filename: string,
  type: 'asset' | 'public',
  hostId: string,
  hostType: 'js' | 'css' | 'html',
  config: ResolvedConfig,
  toRelative: (filename: string, importer: string) => string,
): string {
  const { renderBuiltUrl } = config.experimental
  let relative = config.base === '' || config.base === './'
  if (renderBuiltUrl) {
    const result = renderBuiltUrl(filename, {
      hostId,
      hostType,
      type,
      ssr: !!config.build.ssr,
    })
    if (typeof result === 'object') {
      if (result.runtime) {
        throw new Error(
          `{ runtime: "${result.runtime}" } is not supported for assets in ${hostType} files: ${filename}`,
        )
      }
      if (typeof result.relative === 'boolean') {
        relative = result.relative
      }
    } else if (result) {
      return result
    }
  }
  if (relative && !config.build.ssr) {
    return toRelative(filename, hostId)
  } else {
    return joinUrlSegments(config.decodedBase, filename)
  }
}
function getBaseInHTML(urlRelativePath: string, config: ResolvedConfig) {
  // Prefer explicit URL if defined for linking to assets and public files from HTML,
  // even when base relative is specified
  return config.base === './' || config.base === ''
    ? path.posix.join(
        path.posix.relative(urlRelativePath, '').slice(0, -2),
        './',
      )
    : config.base
}
function joinUrlSegments(a: string, b: string): string {
  if (!a || !b) {
    return a || b || ''
  }
  if (a[a.length - 1] === '/') {
    a = a.substring(0, a.length - 1)
  }
  if (b[0] !== '/') {
    b = '/' + b
  }
  return a + b
}

function toAssetPathFromHtml(
  filename: string,
  htmlPath: string,
  config: ResolvedConfig,
): string {
  const relativeUrlPath = normalizePath(path.relative(config.root, htmlPath))
  const toRelative = (filename: string, _hostId: string) =>
    getBaseInHTML(relativeUrlPath, config) + filename
  return toOutputFilePathInHtml(
    filename,
    'asset',
    htmlPath,
    'html',
    config,
    toRelative,
  )
}

const legacyEnvVarMarker = `__VITE_IS_LEGACY__`

const _require = createRequire(import.meta.url)

const nonLeadingHashInFileNameRE = /[^/]+\[hash(?::\d+)?\]/
const prefixedHashInFileNameRE = /\W?\[hash(?::\d+)?\]/

function viteLegacyPlugin(options: Options = {}): Plugin[] {
  let config: ResolvedConfig
  let targets: Options['targets']
  let modernTargets: Options['modernTargets']

  // browsers supporting ESM + dynamic import + import.meta + async generator
  const modernTargetsEsbuild = [
    'es2020',
    'edge79',
    'firefox67',
    'chrome64',
    'safari12',
  ]
  // same with above but by browserslist syntax
  // es2020 = chrome 80+, safari 13.1+, firefox 72+, edge 80+
  // https://github.com/evanw/esbuild/issues/121#issuecomment-646956379
  const modernTargetsBabel =
    'edge>=79, firefox>=67, chrome>=64, safari>=12, chromeAndroid>=64, iOS>=12'

  const genLegacy = options.renderLegacyChunks !== false
  const genModern = options.renderModernChunks !== false
  if (!genLegacy && !genModern) {
    throw new Error(
      '`renderLegacyChunks` and `renderModernChunks` cannot be both false',
    )
  }

  const debugFlags = (process.env.DEBUG || '').split(',')
  const isDebug =
    debugFlags.includes('vite:*') || debugFlags.includes('vite:legacy')

  const facadeToLegacyChunkMap = new Map()
  const facadeToLegacyPolyfillMap = new Map()
  const facadeToModernPolyfillMap = new Map()
  const modernPolyfills = new Set<string>()
  const legacyPolyfills = new Set<string>()
  // When discovering polyfills in `renderChunk`, the hook may be non-deterministic, so we group the
  // modern and legacy polyfills in a sorted chunks map for each rendered outputs before merging them.
  const outputToChunkFileNameToPolyfills = new WeakMap<
    NormalizedOutputOptions,
    Map<string, { modern: Set<string>; legacy: Set<string> }> | null
  >()

  if (Array.isArray(options.modernPolyfills) && genModern) {
    options.modernPolyfills.forEach((i) => {
      modernPolyfills.add(
        i.includes('/') ? `core-js/${i}` : `core-js/modules/${i}.js`,
      )
    })
  }
  if (Array.isArray(options.additionalModernPolyfills)) {
    options.additionalModernPolyfills.forEach((i) => {
      modernPolyfills.add(i)
    })
  }
  if (Array.isArray(options.polyfills)) {
    options.polyfills.forEach((i) => {
      if (i.startsWith(`regenerator`)) {
        legacyPolyfills.add(`regenerator-runtime/runtime.js`)
      } else {
        legacyPolyfills.add(
          i.includes('/') ? `core-js/${i}` : `core-js/modules/${i}.js`,
        )
      }
    })
  }
  if (Array.isArray(options.additionalLegacyPolyfills)) {
    options.additionalLegacyPolyfills.forEach((i) => {
      legacyPolyfills.add(i)
    })
  }

  let overriddenBuildTarget = false
  let overriddenDefaultModernTargets = false
  const legacyConfigPlugin: Plugin = {
    name: 'vite:legacy-config',

    async config(config, env) {
      if (env.command === 'build' && !config.build?.ssr) {
        if (!config.build) {
          config.build = {}
        }

        if (!config.build.cssTarget) {
          // Hint for esbuild that we are targeting legacy browsers when minifying CSS.
          // Full CSS compat table available at https://github.com/evanw/esbuild/blob/78e04680228cf989bdd7d471e02bbc2c8d345dc9/internal/compat/css_table.go
          // But note that only the `HexRGBA` feature affects the minify outcome.
          // HSL & rebeccapurple values will be minified away regardless the target.
          // So targeting `chrome61` suffices to fix the compatibility issue.
          config.build.cssTarget = 'chrome61'
        }

        if (genLegacy) {
          // Vite's default target browsers are **not** the same.
          // See https://github.com/vitejs/vite/pull/10052#issuecomment-1242076461
          overriddenBuildTarget = config.build.target !== undefined
          overriddenDefaultModernTargets = options.modernTargets !== undefined

          if (options.modernTargets) {
            // Package is ESM only
            const { default: browserslistToEsbuild } = await import(
              'browserslist-to-esbuild'
            )
            config.build.target = browserslistToEsbuild(options.modernTargets)
          } else {
            config.build.target = modernTargetsEsbuild
          }
        }
      }

      return {
        define: {
          'import.meta.env.LEGACY':
            env.command === 'serve' || config.build?.ssr
              ? false
              : legacyEnvVarMarker,
        },
      }
    },
    configResolved(config) {
      if (overriddenBuildTarget) {
        config.logger.warn(
          colors.yellow(
            `plugin-legacy overrode 'build.target'. You should pass 'targets' as an option to this plugin with the list of legacy browsers to support instead.`,
          ),
        )
      }
      if (overriddenDefaultModernTargets) {
        config.logger.warn(
          colors.yellow(
            `plugin-legacy 'modernTargets' option overrode the builtin targets of modern chunks. Some versions of browsers between legacy and modern may not be supported.`,
          ),
        )
      }
    },
  }

  const legacyGenerateBundlePlugin: Plugin = {
    name: 'vite:legacy-generate-polyfill-chunk',
    apply: 'build',

    async generateBundle(opts, bundle) {
      if (config.build.ssr) {
        return
      }

      const chunkFileNameToPolyfills =
        outputToChunkFileNameToPolyfills.get(opts)
      if (chunkFileNameToPolyfills == null) {
        throw new Error(
          'Internal @vitejs/plugin-legacy error: discovered polyfills should exist',
        )
      }

      if (!isLegacyBundle(bundle, opts)) {
        // Merge discovered modern polyfills to `modernPolyfills`
        for (const { modern } of chunkFileNameToPolyfills.values()) {
          modern.forEach((p) => modernPolyfills.add(p))
        }
        if (!modernPolyfills.size) {
          return
        }
        if (isDebug) {
          console.log(
            `[@vitejs/plugin-legacy] modern polyfills:`,
            modernPolyfills,
          )
        }
        await buildPolyfillChunk(
          config.mode,
          modernPolyfills,
          bundle,
          facadeToModernPolyfillMap,
          config.build,
          'es',
          opts,
          true,
          genLegacy,
        )
        return
      }

      if (!genLegacy) {
        return
      }

      // Merge discovered legacy polyfills to `legacyPolyfills`
      for (const { legacy } of chunkFileNameToPolyfills.values()) {
        legacy.forEach((p) => legacyPolyfills.add(p))
      }

      // legacy bundle
      if (options.polyfills !== false) {
        // check if the target needs Promise polyfill because SystemJS relies on it
        // https://github.com/systemjs/systemjs#ie11-support
        await detectPolyfills(
          `Promise.resolve(); Promise.all();`,
          targets,
          legacyPolyfills,
        )
      }

      if (legacyPolyfills.size || !options.externalSystemJS) {
        if (isDebug) {
          console.log(
            `[@vitejs/plugin-legacy] legacy polyfills:`,
            legacyPolyfills,
          )
        }

        await buildPolyfillChunk(
          config.mode,
          legacyPolyfills,
          bundle,
          facadeToLegacyPolyfillMap,
          // force using terser for legacy polyfill minification, since esbuild
          // isn't legacy-safe
          config.build,
          'iife',
          opts,
          options.externalSystemJS,
        )
      }
    },
  }

  const legacyPostPlugin: Plugin = {
    name: 'vite:legacy-post-process',
    enforce: 'post',
    apply: 'build',

    renderStart(opts) {
      // Empty the nested map for this output
      outputToChunkFileNameToPolyfills.set(opts, null)
    },

    configResolved(_config) {
      if (_config.build.lib) {
        throw new Error('@vitejs/plugin-legacy does not support library mode.')
      }
      config = _config

      modernTargets = options.modernTargets || modernTargetsBabel
      if (isDebug) {
        console.log(`[@vitejs/plugin-legacy] modernTargets:`, modernTargets)
      }

      if (!genLegacy || config.build.ssr) {
        return
      }

      targets =
        options.targets ||
        browserslistLoadConfig({ path: config.root }) ||
        'last 2 versions and not dead, > 0.3%, Firefox ESR'
      if (isDebug) {
        console.log(`[@vitejs/plugin-legacy] targets:`, targets)
      }

      const getLegacyOutputFileName = (
        fileNames:
          | string
          | ((chunkInfo: PreRenderedChunk) => string)
          | undefined,
        defaultFileName = '[name]-legacy-[hash].js',
      ): string | ((chunkInfo: PreRenderedChunk) => string) => {
        if (!fileNames) {
          return path.posix.join(config.build.assetsDir, defaultFileName)
        }

        return (chunkInfo) => {
          let fileName =
            typeof fileNames === 'function' ? fileNames(chunkInfo) : fileNames

          if (fileName.includes('[name]')) {
            // [name]-[hash].[format] -> [name]-legacy-[hash].[format]
            fileName = fileName.replace('[name]', '[name]-legacy')
          } else if (nonLeadingHashInFileNameRE.test(fileName)) {
            // custom[hash].[format] -> [name]-legacy[hash].[format]
            // custom-[hash].[format] -> [name]-legacy-[hash].[format]
            // custom.[hash].[format] -> [name]-legacy.[hash].[format]
            // custom.[hash:10].[format] -> custom-legacy.[hash:10].[format]
            fileName = fileName.replace(prefixedHashInFileNameRE, '-legacy$&')
          } else {
            // entry.js -> entry-legacy.js
            // entry.min.js -> entry-legacy.min.js
            fileName = fileName.replace(/(.+?)\.(.+)/, '$1-legacy.$2')
          }

          return fileName
        }
      }

      const createLegacyOutput = (
        options: OutputOptions = {},
      ): OutputOptions => {
        return {
          ...options,
          format: 'system',
          entryFileNames: getLegacyOutputFileName(options.entryFileNames),
          chunkFileNames: getLegacyOutputFileName(options.chunkFileNames),
        }
      }

      const { rollupOptions } = config.build
      const { output } = rollupOptions
      if (Array.isArray(output)) {
        rollupOptions.output = [
          ...output.map(createLegacyOutput),
          ...(genModern ? output : []),
        ]
      } else {
        rollupOptions.output = [
          createLegacyOutput(output),
          ...(genModern ? [output || {}] : []),
        ]
      }
    },

    async renderChunk(raw, chunk, opts, { chunks }) {
      if (config.build.ssr) {
        return null
      }

      // On first run, intialize the map with sorted chunk file names
      let chunkFileNameToPolyfills = outputToChunkFileNameToPolyfills.get(opts)
      if (chunkFileNameToPolyfills == null) {
        chunkFileNameToPolyfills = new Map()
        for (const fileName in chunks) {
          chunkFileNameToPolyfills.set(fileName, {
            modern: new Set(),
            legacy: new Set(),
          })
        }
        outputToChunkFileNameToPolyfills.set(opts, chunkFileNameToPolyfills)
      }
      const polyfillsDiscovered = chunkFileNameToPolyfills.get(chunk.fileName)
      if (polyfillsDiscovered == null) {
        throw new Error(
          `Internal @vitejs/plugin-legacy error: discovered polyfills for ${chunk.fileName} should exist`,
        )
      }

      if (!isLegacyChunk(chunk, opts)) {
        if (
          options.modernPolyfills &&
          !Array.isArray(options.modernPolyfills) &&
          genModern
        ) {
          // analyze and record modern polyfills
          await detectPolyfills(raw, modernTargets, polyfillsDiscovered.modern)
        }

        const ms = new MagicString(raw)

        if (genLegacy && chunk.isEntry) {
          // append this code to avoid modern chunks running on legacy targeted browsers
          ms.prepend(modernChunkLegacyGuard)
        }

        if (raw.includes(legacyEnvVarMarker)) {
          const re = new RegExp(legacyEnvVarMarker, 'g')
          let match
          while ((match = re.exec(raw))) {
            ms.overwrite(
              match.index,
              match.index + legacyEnvVarMarker.length,
              `false`,
            )
          }
        }

        if (config.build.sourcemap) {
          return {
            code: ms.toString(),
            map: ms.generateMap({ hires: 'boundary' }),
          }
        }
        return {
          code: ms.toString(),
        }
      }

      if (!genLegacy) {
        return null
      }

      // @ts-expect-error avoid esbuild transform on legacy chunks since it produces
      // legacy-unsafe code - e.g. rewriting object properties into shorthands
      opts.__vite_skip_esbuild__ = true

      // @ts-expect-error force terser for legacy chunks. This only takes effect if
      // minification isn't disabled, because that leaves out the terser plugin
      // entirely.
      opts.__vite_force_terser__ = true

      // @ts-expect-error In the `generateBundle` hook,
      // we'll delete the assets from the legacy bundle to avoid emitting duplicate assets.
      // But that's still a waste of computing resource.
      // So we add this flag to avoid emitting the asset in the first place whenever possible.
      opts.__vite_skip_asset_emit__ = true

      // avoid emitting assets for legacy bundle
      const needPolyfills =
        options.polyfills !== false && !Array.isArray(options.polyfills)

      // transform the legacy chunk with @babel/preset-env
      const sourceMaps = !!config.build.sourcemap
      const babel = await loadBabel()
      const result = babel.transform(raw, {
        babelrc: false,
        configFile: false,
        compact: !!config.build.minify,
        sourceMaps,
        inputSourceMap: undefined,
        presets: [
          // forcing our plugin to run before preset-env by wrapping it in a
          // preset so we can catch the injected import statements...
          [
            () => ({
              plugins: [
                recordAndRemovePolyfillBabelPlugin(polyfillsDiscovered.legacy),
                replaceLegacyEnvBabelPlugin(),
                wrapIIFEBabelPlugin(),
              ],
            }),
          ],
          [
            (await import('@babel/preset-env')).default,
            createBabelPresetEnvOptions(targets, { needPolyfills }),
          ],
        ],
      })

      if (result) return { code: result.code!, map: result.map }
      return null
    },

    transformIndexHtml(html, { chunk }) {
      if (config.build.ssr) return
      if (!chunk) return
      if (chunk.fileName.includes('-legacy')) {
        // The legacy bundle is built first, and its index.html isn't actually emitted if
        // modern bundle will be generated. Here we simply record its corresponding legacy chunk.
        facadeToLegacyChunkMap.set(chunk.facadeModuleId, chunk.fileName)
        if (genModern) {
          return
        }
      }
      if (!genModern) {
        html = html.replace(/<script type="module".*?<\/script>/g, '')
      }

      const tags: HtmlTagDescriptor[] = []
      const htmlFilename = chunk.facadeModuleId?.replace(/\?.*$/, '')

      // 1. inject modern polyfills
      if (genModern) {
        const modernPolyfillFilename = facadeToModernPolyfillMap.get(
          chunk.facadeModuleId,
        )

        if (modernPolyfillFilename) {
          tags.push({
            tag: 'script',
            attrs: {
              type: 'module',
              crossorigin: true,
              src: toAssetPathFromHtml(
                modernPolyfillFilename,
                chunk.facadeModuleId!,
                config,
              ),
            },
          })
        } else if (modernPolyfills.size) {
          throw new Error(
            `No corresponding modern polyfill chunk found for ${htmlFilename}`,
          )
        }
      }

      if (!genLegacy) {
        return { html, tags }
      }

      // 2. inject Safari 10 nomodule fix
      if (genModern) {
        tags.push({
          tag: 'script',
          attrs: { nomodule: genModern },
          children: safari10NoModuleFix,
          injectTo: 'body',
        })
      }

      // 3. inject legacy polyfills
      const legacyPolyfillFilename = facadeToLegacyPolyfillMap.get(
        chunk.facadeModuleId,
      )
      if (legacyPolyfillFilename) {
        tags.push({
          tag: 'script',
          attrs: {
            nomodule: genModern,
            crossorigin: true,
            id: legacyPolyfillId,
            src: toAssetPathFromHtml(
              legacyPolyfillFilename,
              chunk.facadeModuleId!,
              config,
            ),
          },
          injectTo: 'body',
        })
      } else if (legacyPolyfills.size) {
        throw new Error(
          `No corresponding legacy polyfill chunk found for ${htmlFilename}`,
        )
      }

      // 4. inject legacy entry
      const legacyEntryFilename = facadeToLegacyChunkMap.get(
        chunk.facadeModuleId,
      )
      if (legacyEntryFilename) {
        // `assets/foo.js` means importing "named register" in SystemJS
        tags.push({
          tag: 'script',
          attrs: {
            nomodule: genModern,
            crossorigin: true,
            // we set the entry path on the element as an attribute so that the
            // script content will stay consistent - which allows using a constant
            // hash value for CSP.
            id: legacyEntryId,
            'data-src': toAssetPathFromHtml(
              legacyEntryFilename,
              chunk.facadeModuleId!,
              config,
            ),
          },
          children: systemJSInlineCode,
          injectTo: 'body',
        })
      } else {
        throw new Error(
          `No corresponding legacy entry chunk found for ${htmlFilename}`,
        )
      }

      // 5. inject dynamic import fallback entry
      if (legacyPolyfillFilename && legacyEntryFilename && genModern) {
        tags.push({
          tag: 'script',
          attrs: { type: 'module' },
          children: detectModernBrowserCode,
          injectTo: 'head',
        })
        tags.push({
          tag: 'script',
          attrs: { type: 'module' },
          children: dynamicFallbackInlineCode,
          injectTo: 'head',
        })
      }

      return {
        html,
        tags,
      }
    },

    generateBundle(opts, bundle) {
      if (config.build.ssr) {
        return
      }

      if (isLegacyBundle(bundle, opts) && genModern) {
        // avoid emitting duplicate assets
        for (const name in bundle) {
          if (bundle[name].type === 'asset' && !/.+\.map$/.test(name)) {
            delete bundle[name]
          }
        }
      }
    },
  }

  return [legacyConfigPlugin, legacyGenerateBundlePlugin, legacyPostPlugin]
}

export async function detectPolyfills(
  code: string,
  targets: any,
  list: Set<string>,
): Promise<void> {
  const babel = await loadBabel()
  const result = babel.transform(code, {
    ast: true,
    babelrc: false,
    configFile: false,
    compact: false,
    presets: [
      [
        (await import('@babel/preset-env')).default,
        createBabelPresetEnvOptions(targets, {}),
      ],
    ],
  })
  for (const node of result!.ast!.program.body) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value
      if (
        source.startsWith('core-js/') ||
        source.startsWith('regenerator-runtime/')
      ) {
        list.add(source)
      }
    }
  }
}

function createBabelPresetEnvOptions(
  targets: any,
  { needPolyfills = true }: { needPolyfills?: boolean },
) {
  return {
    targets,
    bugfixes: true,
    loose: false,
    modules: false,
    useBuiltIns: needPolyfills ? 'usage' : false,
    corejs: needPolyfills
      ? {
          version: _require('core-js/package.json').version,
          proposals: false,
        }
      : undefined,
    shippedProposals: true,
    ignoreBrowserslistConfig: true,
  }
}

async function buildPolyfillChunk(
  mode: string,
  imports: Set<string>,
  bundle: OutputBundle,
  facadeToChunkMap: Map<string, string>,
  buildOptions: BuildOptions,
  format: 'iife' | 'es',
  rollupOutputOptions: NormalizedOutputOptions,
  excludeSystemJS?: boolean,
  prependModenChunkLegacyGuard?: boolean,
) {
  let { minify, assetsDir, sourcemap } = buildOptions
  minify = minify ? 'terser' : false
  const res = await build({
    mode,
    // so that everything is resolved from here
    root: path.dirname(fileURLToPath(import.meta.url)),
    configFile: false,
    logLevel: 'error',
    plugins: [
      polyfillsPlugin(imports, excludeSystemJS),
      prependModenChunkLegacyGuard && prependModenChunkLegacyGuardPlugin(),
    ],
    build: {
      write: false,
      minify,
      assetsDir,
      sourcemap,
      rollupOptions: {
        input: {
          polyfills: polyfillId,
        },
        output: {
          format,
          entryFileNames: rollupOutputOptions.entryFileNames,
        },
      },
    },
    // Don't run esbuild for transpilation or minification
    // because we don't want to transpile code.
    esbuild: false,
    optimizeDeps: {
      esbuildOptions: {
        // If a value above 'es5' is set, esbuild injects helper functions which uses es2015 features.
        // This limits the input code not to include es2015+ codes.
        // But core-js is the only dependency which includes commonjs code
        // and core-js doesn't include es2015+ codes.
        target: 'es5',
      },
    },
  })
  const _polyfillChunk = Array.isArray(res) ? res[0] : res
  if (!('output' in _polyfillChunk)) return
  const polyfillChunk = _polyfillChunk.output.find(
    (chunk) => chunk.type === 'chunk' && chunk.isEntry,
  ) as OutputChunk

  // associate the polyfill chunk to every entry chunk so that we can retrieve
  // the polyfill filename in index html transform
  for (const key in bundle) {
    const chunk = bundle[key]
    if (chunk.type === 'chunk' && chunk.facadeModuleId) {
      facadeToChunkMap.set(chunk.facadeModuleId, polyfillChunk.fileName)
    }
  }

  // add the chunk to the bundle
  bundle[polyfillChunk.fileName] = polyfillChunk
  if (polyfillChunk.sourcemapFileName) {
    const polyfillChunkMapAsset = _polyfillChunk.output.find(
      (chunk) =>
        chunk.type === 'asset' &&
        chunk.fileName === polyfillChunk.sourcemapFileName,
    ) as OutputAsset | undefined
    if (polyfillChunkMapAsset) {
      bundle[polyfillChunk.sourcemapFileName] = polyfillChunkMapAsset
    }
  }
}

const polyfillId = '\0vite/legacy-polyfills'

function polyfillsPlugin(
  imports: Set<string>,
  excludeSystemJS?: boolean,
): Plugin {
  return {
    name: 'vite:legacy-polyfills',
    resolveId(id) {
      if (id === polyfillId) {
        return id
      }
    },
    load(id) {
      if (id === polyfillId) {
        return (
          [...imports].map((i) => `import ${JSON.stringify(i)};`).join('') +
          (excludeSystemJS ? '' : `import "systemjs/dist/s.min.js";`)
        )
      }
    },
  }
}

function prependModenChunkLegacyGuardPlugin(): Plugin {
  let sourceMapEnabled!: boolean
  return {
    name: 'vite:legacy-prepend-moden-chunk-legacy-guard',
    configResolved(config) {
      sourceMapEnabled = !!config.build.sourcemap
    },
    renderChunk(code) {
      if (!sourceMapEnabled) {
        return modernChunkLegacyGuard + code
      }

      const ms = new MagicString(code)
      ms.prepend(modernChunkLegacyGuard)
      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: 'boundary' }),
      }
    },
  }
}

function isLegacyChunk(chunk: RenderedChunk, options: NormalizedOutputOptions) {
  return options.format === 'system' && chunk.fileName.includes('-legacy')
}

function isLegacyBundle(
  bundle: OutputBundle,
  options: NormalizedOutputOptions,
) {
  if (options.format === 'system') {
    const entryChunk = Object.values(bundle).find(
      (output) => output.type === 'chunk' && output.isEntry,
    )

    return !!entryChunk && entryChunk.fileName.includes('-legacy')
  }

  return false
}

function recordAndRemovePolyfillBabelPlugin(
  polyfills: Set<string>,
): BabelPlugin {
  return ({ types: t }: { types: typeof BabelTypes }): BabelPlugin => ({
    name: 'vite-remove-polyfill-import',
    post({ path }) {
      path.get('body').forEach((p) => {
        if (t.isImportDeclaration(p.node)) {
          polyfills.add(p.node.source.value)
          p.remove()
        }
      })
    },
  })
}

function replaceLegacyEnvBabelPlugin(): BabelPlugin {
  return ({ types: t }): BabelPlugin => ({
    name: 'vite-replace-env-legacy',
    visitor: {
      Identifier(path) {
        if (path.node.name === legacyEnvVarMarker) {
          path.replaceWith(t.booleanLiteral(true))
        }
      },
    },
  })
}

function wrapIIFEBabelPlugin(): BabelPlugin {
  return ({ types: t, template }): BabelPlugin => {
    const buildIIFE = template(';(function(){%%body%%})();')

    return {
      name: 'vite-wrap-iife',
      post({ path }) {
        if (!this.isWrapped) {
          this.isWrapped = true
          path.replaceWith(t.program(buildIIFE({ body: path.node.body })))
        }
      },
    }
  }
}

const hash =
  // eslint-disable-next-line n/no-unsupported-features/node-builtins -- crypto.hash is supported in Node 21.7.0+, 20.12.0+
  crypto.hash ??
  ((
    algorithm: string,
    data: crypto.BinaryLike,
    outputEncoding: crypto.BinaryToTextEncoding,
  ) => crypto.createHash(algorithm).update(data).digest(outputEncoding))

export const cspHashes = [
  safari10NoModuleFix,
  systemJSInlineCode,
  detectModernBrowserCode,
  dynamicFallbackInlineCode,
].map((i) => hash('sha256', i, 'base64'))

export type { Options }

export default viteLegacyPlugin
