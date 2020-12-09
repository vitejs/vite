import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { Ora } from 'ora'
import { klona } from 'klona/json'
import { resolveFrom, lookupFile, toArray, isStaticAsset } from '../utils'
import {
  rollup as Rollup,
  ExternalOption,
  Plugin,
  InputOption,
  InputOptions,
  OutputOptions,
  OutputPlugin,
  RollupOutput
} from 'rollup'
import {
  createResolver,
  supportedExts,
  mainFields,
  InternalResolver
} from '../resolver'
import { createBuildResolvePlugin } from './buildPluginResolve'
import { createBuildHtmlPlugin } from './buildPluginHtml'
import { createBuildCssPlugin } from './buildPluginCss'
import { createBuildAssetPlugin } from './buildPluginAsset'
import {
  createEsbuildPlugin,
  createEsbuildRenderChunkPlugin
} from './buildPluginEsbuild'
import { createReplacePlugin } from './buildPluginReplace'
import { BuildConfig, defaultDefines } from '../config'
import { createBuildJsTransformPlugin } from '../transform'
import hash_sum from 'hash-sum'
import { resolvePostcssOptions, isCSSRequest } from '../utils/cssUtils'
import { createBuildWasmPlugin } from './buildPluginWasm'
import { createBuildManifestPlugin } from './buildPluginManifest'
import { stopService } from '../esbuildService'

interface Build extends InputOptions {
  input: InputOption
  output: OutputOptions
  /** Runs before global post-build hooks. */
  onResult?: PostBuildHook
}

export interface BuildResult {
  build: Build
  html: string
  assets: RollupOutput['output']
}

/** For adding Rollup builds and mutating the Vite config. */
export type BuildPlugin = (
  config: BuildConfig,
  builds: Build[]
) => PostBuildHook | void

/** Returned by `configureBuild` hook to mutate a build's output. */
export type PostBuildHook = (result: BuildResult) => Promise<void> | void

const enum WriteType {
  JS,
  CSS,
  ASSET,
  HTML,
  SOURCE_MAP
}

const writeColors = {
  [WriteType.JS]: chalk.cyan,
  [WriteType.CSS]: chalk.magenta,
  [WriteType.ASSET]: chalk.green,
  [WriteType.HTML]: chalk.blue,
  [WriteType.SOURCE_MAP]: chalk.gray
}

const warningIgnoreList = [`CIRCULAR_DEPENDENCY`, `THIS_IS_UNDEFINED`]
const dynamicImportWarningIgnoreList = [
  `Unsupported expression`,
  `statically analyzed`
]

const isBuiltin = require('isbuiltin')

export function onRollupWarning(
  spinner: Ora | undefined,
  options: BuildConfig['optimizeDeps']
): InputOptions['onwarn'] {
  return (warning, warn) => {
    if (warning.code === 'UNRESOLVED_IMPORT') {
      let message: string
      const id = warning.source
      const importer = warning.importer
      if (isBuiltin(id)) {
        let importingDep
        if (importer) {
          const pkg = JSON.parse(lookupFile(importer, ['package.json']) || `{}`)
          if (pkg.name) {
            importingDep = pkg.name
          }
        }
        const allowList = options.allowNodeBuiltins
        if (importingDep && allowList && allowList.includes(importingDep)) {
          return
        }
        const dep = importingDep
          ? `Dependency ${chalk.yellow(importingDep)}`
          : `A dependency`
        message =
          `${dep} is attempting to import Node built-in module ${chalk.yellow(
            id
          )}.\n` +
          `This will not work in a browser environment.\n` +
          `Imported by: ${chalk.gray(importer)}`
      } else {
        message =
          `[vite]: Rollup failed to resolve import "${warning.source}" from "${warning.importer}".\n` +
          `This is most likely unintended because it can break your application at runtime.\n` +
          `If you do want to externalize this module explicitly add it to\n` +
          `\`rollupInputOptions.external\``
      }
      if (spinner) {
        spinner.stop()
      }
      throw new Error(message)
    }
    if (
      warning.plugin === 'rollup-plugin-dynamic-import-variables' &&
      dynamicImportWarningIgnoreList.some((msg) =>
        warning.message.includes(msg)
      )
    ) {
      return
    }

    if (!warningIgnoreList.includes(warning.code!)) {
      // ora would swallow the console.warn if we let it keep running
      // https://github.com/sindresorhus/ora/issues/90
      if (spinner) {
        spinner.stop()
      }
      warn(warning)
      if (spinner) {
        spinner.start()
      }
    }
  }
}

/**
 * Creates non-application specific plugins that are shared between the main
 * app and the dependencies. This is used by the `optimize` command to
 * pre-bundle dependencies.
 */
export async function createBaseRollupPlugins(
  root: string,
  resolver: InternalResolver,
  options: Partial<BuildConfig>
): Promise<Plugin[]> {
  const {
    transforms = [],
    vueCustomBlockTransforms = {},
    enableEsbuild = true,
    enableRollupPluginVue = true
  } = options
  const { nodeResolve } = require('@rollup/plugin-node-resolve')
  const dynamicImport = require('rollup-plugin-dynamic-import-variables')

  return [
    // vite:resolve
    createBuildResolvePlugin(root, resolver),
    // vite:esbuild
    enableEsbuild ? await createEsbuildPlugin(options.jsx) : null,
    // vue
    enableRollupPluginVue ? await createVuePlugin(root, options) : null,
    require('@rollup/plugin-json')({
      preferConst: true,
      indent: '  ',
      compact: false,
      namedExports: true
    }),
    // user transforms
    ...(transforms.length || Object.keys(vueCustomBlockTransforms).length
      ? [createBuildJsTransformPlugin(transforms, vueCustomBlockTransforms)]
      : []),
    nodeResolve({
      rootDir: root,
      extensions: supportedExts,
      preferBuiltins: false,
      dedupe: options.rollupDedupe || [],
      mainFields
    }),
    require('@rollup/plugin-commonjs')({
      extensions: ['.js', '.cjs']
    }),
    dynamicImport({
      warnOnError: true,
      include: [/\.js$/],
      exclude: [/node_modules/]
    })
  ].filter(Boolean)
}

async function createVuePlugin(
  root: string,
  {
    vueCustomBlockTransforms = {},
    rollupPluginVueOptions,
    cssPreprocessOptions,
    cssModuleOptions,
    vueCompilerOptions,
    vueTransformAssetUrls = {},
    vueTemplatePreprocessOptions = {}
  }: Partial<BuildConfig>
) {
  const {
    options: postcssOptions,
    plugins: postcssPlugins
  } = await resolvePostcssOptions(root, true)

  if (typeof vueTransformAssetUrls === 'object') {
    vueTransformAssetUrls = {
      includeAbsolute: true,
      ...vueTransformAssetUrls
    }
  }

  return require('rollup-plugin-vue')({
    ...rollupPluginVueOptions,
    templatePreprocessOptions: {
      ...vueTemplatePreprocessOptions,
      pug: {
        doctype: 'html',
        ...(vueTemplatePreprocessOptions && vueTemplatePreprocessOptions.pug)
      }
    },
    transformAssetUrls: vueTransformAssetUrls,
    postcssOptions,
    postcssPlugins,
    preprocessStyles: true,
    preprocessOptions: cssPreprocessOptions,
    preprocessCustomRequire: (id: string) => require(resolveFrom(root, id)),
    compilerOptions: vueCompilerOptions,
    cssModulesOptions: {
      localsConvention: 'camelCase',
      generateScopedName: (local: string, filename: string) =>
        `${local}_${hash_sum(filename)}`,
      ...cssModuleOptions,
      ...(rollupPluginVueOptions && rollupPluginVueOptions.cssModulesOptions)
    },
    customBlocks: Object.keys(vueCustomBlockTransforms)
  })
}

/**
 * Clone the given config object and fill it with default values.
 */
function prepareConfig(config: Partial<BuildConfig>): BuildConfig {
  const {
    alias = {},
    assetsDir = '_assets',
    assetsInclude = isStaticAsset,
    assetsInlineLimit = 4096,
    base = '/',
    cssCodeSplit = true,
    cssModuleOptions = {},
    cssPreprocessOptions = {},
    define = {},
    emitAssets = true,
    emitIndex = true,
    enableEsbuild = true,
    enableRollupPluginVue = true,
    entry = 'index.html',
    env = {},
    esbuildTarget = 'es2020',
    indexHtmlTransforms = [],
    jsx = 'vue',
    minify = true,
    mode = 'production',
    optimizeDeps = {},
    outDir = 'dist',
    resolvers = [],
    rollupDedupe = [],
    rollupInputOptions = {},
    rollupOutputOptions = {},
    rollupPluginVueOptions = {},
    root = process.cwd(),
    shouldPreload = null,
    silent = false,
    sourcemap = false,
    terserOptions = {},
    transforms = [],
    vueCompilerOptions = {},
    vueCustomBlockTransforms = {},
    vueTransformAssetUrls = {},
    vueTemplatePreprocessOptions = {},
    write = true
  } = klona(config)

  return {
    ...config,
    alias,
    assetsDir,
    assetsInclude,
    assetsInlineLimit,
    base,
    cssCodeSplit,
    cssModuleOptions,
    cssPreprocessOptions,
    define,
    emitAssets,
    emitIndex,
    enableEsbuild,
    enableRollupPluginVue,
    entry,
    env,
    esbuildTarget,
    indexHtmlTransforms,
    jsx,
    minify,
    mode,
    optimizeDeps,
    outDir,
    resolvers,
    rollupDedupe,
    rollupInputOptions,
    rollupOutputOptions,
    rollupPluginVueOptions,
    root,
    shouldPreload,
    silent,
    sourcemap,
    terserOptions,
    transforms,
    vueCompilerOptions,
    vueCustomBlockTransforms,
    vueTransformAssetUrls,
    vueTemplatePreprocessOptions,
    write
  }
}

/**
 * Track parallel build calls and only stop the esbuild service when all
 * builds are done. (#1098)
 */
let parallelCallCounts = 0

/**
 * Bundles the app for production.
 * Returns a Promise containing the build result.
 */
export async function build(
  options: Partial<BuildConfig>
): Promise<BuildResult[]> {
  parallelCallCounts++
  try {
    return await doBuild(options)
  } finally {
    parallelCallCounts--
    if (parallelCallCounts <= 0) {
      await stopService()
    }
  }
}

async function doBuild(options: Partial<BuildConfig>): Promise<BuildResult[]> {
  const builds: Build[] = []

  const config = prepareConfig(options)
  const postBuildHooks = toArray(config.configureBuild)
    .map((configureBuild) => configureBuild(config, builds))
    .filter(Boolean) as PostBuildHook[]

  const {
    root,
    assetsDir,
    assetsInlineLimit,
    emitAssets,
    minify,
    silent,
    sourcemap,
    shouldPreload,
    env,
    mode: configMode,
    define: userDefineReplacements,
    write
  } = config

  const isTest = process.env.NODE_ENV === 'test'
  const resolvedMode = process.env.VITE_ENV || configMode

  // certain plugins like rollup-plugin-vue relies on NODE_ENV for behavior
  // so we should always set it
  process.env.NODE_ENV =
    resolvedMode === 'test' || resolvedMode === 'development'
      ? resolvedMode
      : 'production'

  const start = Date.now()

  let spinner: Ora | undefined
  const msg = `Building ${configMode} bundle...`
  if (!silent) {
    if (process.env.DEBUG || isTest) {
      console.log(msg)
    } else {
      spinner = require('ora')(msg + '\n').start()
    }
  }

  const outDir = path.resolve(root, config.outDir)
  const entryPath = path.resolve(root, config.entry)
  const indexPath = /\.(html|php)$/.test(entryPath)
    ? entryPath
    : path.join(root, 'index.html')
  const publicDir = path.join(root, 'public')
  const publicBasePath = config.base.replace(/([^/])$/, '$1/') // ensure ending slash
  const resolvedAssetsPath = path.join(outDir, assetsDir)
  const resolver = createResolver(
    root,
    config.resolvers,
    config.alias,
    config.assetsInclude
  )

  const { htmlPlugin, renderIndex } = await createBuildHtmlPlugin(
    root,
    indexPath,
    publicBasePath,
    assetsDir,
    assetsInlineLimit,
    resolver,
    shouldPreload,
    options
  )

  const basePlugins = await createBaseRollupPlugins(root, resolver, config)

  // https://github.com/darionco/rollup-plugin-web-worker-loader
  // configured to support `import Worker from './my-worker?worker'`
  // this plugin relies on resolveId and must be placed before node-resolve
  // since the latter somehow swallows ids with query strings since 8.x
  basePlugins.splice(
    basePlugins.findIndex((p) => p.name.includes('node-resolve')),
    0,
    require('rollup-plugin-web-worker-loader')({
      targetPlatform: 'browser',
      pattern: /(.+)\?worker$/,
      extensions: supportedExts,
      sourcemap: false // it's inlined so it bloats the bundle
    })
  )

  // user env variables loaded from .env files.
  // only those prefixed with VITE_ are exposed.
  const userClientEnv: Record<string, string | boolean> = {}
  const userEnvReplacements: Record<string, string> = {}
  Object.keys(env).forEach((key) => {
    if (key.startsWith(`VITE_`)) {
      userEnvReplacements[`import.meta.env.${key}`] = JSON.stringify(env[key])
      userClientEnv[key] = env[key]
    }
  })

  const builtInClientEnv = {
    BASE_URL: publicBasePath,
    MODE: configMode,
    DEV: resolvedMode !== 'production',
    PROD: resolvedMode === 'production'
  }
  const builtInEnvReplacements: Record<string, string> = {}
  Object.keys(builtInClientEnv).forEach((key) => {
    builtInEnvReplacements[`import.meta.env.${key}`] = JSON.stringify(
      builtInClientEnv[key as keyof typeof builtInClientEnv]
    )
  })
  Object.keys(userDefineReplacements).forEach((key) => {
    userDefineReplacements[key] = JSON.stringify(userDefineReplacements[key])
  })

  const {
    pluginsPreBuild = [],
    plugins = [],
    pluginsPostBuild = [],
    pluginsOptimizer,
    ...rollupInputOptions
  } = config.rollupInputOptions

  builds.unshift({
    input: entryPath,
    preserveEntrySignatures: false,
    treeshake: { moduleSideEffects: 'no-external' },
    ...rollupInputOptions,
    output: config.rollupOutputOptions,
    plugins: [
      ...plugins,
      ...pluginsPreBuild,
      ...basePlugins,
      // vite:html
      htmlPlugin,
      // we use a custom replacement plugin because @rollup/plugin-replace
      // performs replacements twice, once at transform and once at renderChunk
      // - which makes it impossible to exclude Vue templates from it since
      // Vue templates are compiled into js and included in chunks.
      createReplacePlugin(
        (id) =>
          !/\?vue&type=template/.test(id) &&
          // also exclude css and static assets for performance
          !isCSSRequest(id) &&
          !resolver.isAssetRequest(id),
        {
          ...defaultDefines,
          ...userDefineReplacements,
          ...userEnvReplacements,
          ...builtInEnvReplacements,
          'import.meta.env.': `({}).`,
          'import.meta.env': JSON.stringify({
            ...userClientEnv,
            ...builtInClientEnv
          }),
          'process.env.NODE_ENV': JSON.stringify(resolvedMode),
          'process.env.': `({}).`,
          'process.env': JSON.stringify({ NODE_ENV: resolvedMode }),
          'import.meta.hot': `false`
        },
        !!sourcemap
      ),
      // vite:css
      createBuildCssPlugin({
        root,
        publicBase: publicBasePath,
        assetsDir,
        minify,
        inlineLimit: assetsInlineLimit,
        cssCodeSplit: config.cssCodeSplit,
        preprocessOptions: config.cssPreprocessOptions,
        modulesOptions: config.cssModuleOptions
      }),
      // vite:wasm
      createBuildWasmPlugin(root, publicBasePath, assetsDir, assetsInlineLimit),
      // vite:asset
      createBuildAssetPlugin(
        root,
        resolver,
        publicBasePath,
        assetsDir,
        assetsInlineLimit
      ),
      config.enableEsbuild &&
        createEsbuildRenderChunkPlugin(
          config.esbuildTarget,
          minify === 'esbuild'
        ),
      // minify with terser
      // this is the default which has better compression, but slow
      // the user can opt-in to use esbuild which is much faster but results
      // in ~8-10% larger file size.
      minify && minify !== 'esbuild'
        ? require('rollup-plugin-terser').terser(config.terserOptions)
        : undefined,
      // #728 user plugins should apply after `@rollup/plugin-commonjs`
      // #471#issuecomment-683318951 user plugin after internal plugin
      ...pluginsPostBuild,
      // vite:manifest
      config.emitManifest ? createBuildManifestPlugin() : undefined
    ].filter(Boolean)
  })

  // lazy require rollup so that we don't load it when only using the dev server
  // importing it just for the types
  const rollup = require('rollup').rollup as typeof Rollup

  // multiple builds are processed sequentially, in case a build
  // depends on the output of a preceding build.
  const results = []
  for (let i = 0; i < builds.length; i++) {
    const build = builds[i]
    const { output: outputOptions, onResult, ...inputOptions } = build
    const emitIndexPath = getEmitIndexPath(indexPath, outDir, build)
    const emitIndex = config.emitIndex && emitIndexPath !== ''

    // unset the `output.file` option once `indexHtmlPath` is declared,
    // or else Rollup throws an error since multiple chunks are generated.
    if (emitIndexPath && outputOptions.file) {
      outputOptions.file = undefined
    }

    let result!: BuildResult

    try {
      const bundle = await rollup({
        onwarn: onRollupWarning(spinner, config.optimizeDeps),
        ...inputOptions,
        plugins: [
          ...(inputOptions.plugins || []).filter(
            // remove vite:emit in case this build copied another build's plugins
            (plugin) => plugin.name !== 'vite:emit'
          ),
          // vite:emit
          createEmitPlugin(emitAssets, async (assets, name) => {
            // #1071 ignore bundles from rollup-plugin-worker-loader
            if (name !== outputOptions.name) return

            const html = emitIndex ? await renderIndex(assets) : ''

            result = { build, assets, html }
            if (onResult) {
              await onResult(result)
            }

            // run post-build hooks sequentially
            await postBuildHooks.reduce(
              (queue, hook) => queue.then(() => hook(result)),
              Promise.resolve()
            )

            if (write) {
              if (i === 0) {
                await fs.emptyDir(outDir)
              }
              if (emitIndex) {
                await fs.writeFile(emitIndexPath, result.html)
              }
            }
          })
        ]
      })

      await bundle[write ? 'write' : 'generate']({
        dir: resolvedAssetsPath,
        format: 'es',
        sourcemap,
        entryFileNames: `[name].[hash].js`,
        chunkFileNames: `[name].[hash].js`,
        assetFileNames: `[name].[hash].[ext]`,
        // #764 add `Symbol.toStringTag` when build es module into cjs chunk
        // #1048 add `Symbol.toStringTag` for module default export
        namespaceToStringTag: true,
        ...outputOptions
      })
    } finally {
      spinner && spinner.stop()
    }

    if (write && !silent) {
      if (emitIndex) {
        printFileInfo(emitIndexPath, result.html, WriteType.HTML)
      }
      for (const chunk of result.assets) {
        if (chunk.type === 'chunk') {
          const filePath = path.join(resolvedAssetsPath, chunk.fileName)
          printFileInfo(filePath, chunk.code, WriteType.JS)
          if (chunk.map) {
            printFileInfo(
              filePath + '.map',
              chunk.map.toString(),
              WriteType.SOURCE_MAP
            )
          }
        } else if (emitAssets && chunk.source)
          printFileInfo(
            path.join(resolvedAssetsPath, chunk.fileName),
            chunk.source,
            chunk.fileName.endsWith('.css') ? WriteType.CSS : WriteType.ASSET
          )
      }
    }

    spinner && spinner.start()
    results.push(result)
  }

  // copy over /public if it exists
  if (write && emitAssets && fs.existsSync(publicDir)) {
    for (const file of await fs.readdir(publicDir)) {
      await fs.copy(path.join(publicDir, file), path.resolve(outDir, file))
    }
  }

  spinner && spinner.stop()

  if (!silent) {
    console.log(
      `Build completed in ${((Date.now() - start) / 1000).toFixed(2)}s.\n`
    )
  }

  return results
}

/**
 * Bundles the app in SSR mode.
 * - All Vue dependencies are automatically externalized
 * - Imports to dependencies are compiled into require() calls
 * - Templates are compiled with SSR specific optimizations.
 */
export async function ssrBuild(
  options: Partial<BuildConfig>
): Promise<BuildResult[]> {
  const {
    rollupInputOptions,
    rollupOutputOptions,
    rollupPluginVueOptions
  } = options

  return build({
    outDir: 'dist-ssr',
    ...options,
    rollupPluginVueOptions: {
      target: 'node',
      ...rollupPluginVueOptions
    },
    rollupInputOptions: {
      ...rollupInputOptions,
      external: resolveExternal(
        rollupInputOptions && rollupInputOptions.external
      )
    },
    rollupOutputOptions: {
      format: 'cjs',
      exports: 'named',
      entryFileNames: '[name].js',
      ...rollupOutputOptions
    },
    emitIndex: false,
    emitAssets: false,
    cssCodeSplit: false,
    minify: false
  })
}

function createEmitPlugin(
  emitAssets: boolean,
  emit: (
    assets: BuildResult['assets'],
    name: string | undefined
  ) => Promise<void>
): OutputPlugin {
  return {
    name: 'vite:emit',
    async generateBundle({ name }, output) {
      // assume the first asset in `output` is an entry chunk
      const assets = Object.values(output) as BuildResult['assets']

      // process the output before writing
      await emit(assets, name)

      // write any assets injected by post-build hooks
      for (const asset of assets) {
        output[asset.fileName] = asset
      }

      // remove assets from bundle if emitAssets is false
      if (!emitAssets) {
        for (const name in output) {
          if (output[name].type === 'asset') {
            delete output[name]
          }
        }
      }
    }
  }
}

/**
 * Return the output path for the compiled `indexPath` contents, relative to
 * the `outDir` option. An empty string is returned if the given Rollup build
 * doesn't have `indexPath` as its only input.
 */
function getEmitIndexPath(
  indexPath: string,
  outDir: string,
  { input, output }: Build
) {
  return typeof input === 'string' && path.resolve(input) === indexPath
    ? path.resolve(outDir, output.file || input)
    : ''
}

function resolveExternal(
  userExternal: ExternalOption | undefined
): ExternalOption {
  const required = ['vue', /^@vue\//]
  if (!userExternal) {
    return required
  }
  if (Array.isArray(userExternal)) {
    return [...required, ...userExternal]
  } else if (typeof userExternal === 'function') {
    return (src, importer, isResolved) => {
      if (src === 'vue' || /^@vue\//.test(src)) {
        return true
      }
      return userExternal(src, importer, isResolved)
    }
  } else {
    return [...required, userExternal]
  }
}

function printFileInfo(
  filePath: string,
  content: string | Uint8Array,
  type: WriteType
) {
  const needCompression =
    type === WriteType.JS || type === WriteType.CSS || type === WriteType.HTML

  const compressed = needCompression
    ? `, brotli: ${(require('brotli-size').sync(content) / 1024).toFixed(2)}kb`
    : ``

  console.log(
    `${chalk.gray(`[write]`)} ${writeColors[type](
      path.relative(process.cwd(), filePath)
    )} ${(content.length / 1024).toFixed(2)}kb${compressed}`
  )
}
