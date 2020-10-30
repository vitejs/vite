import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { Ora } from 'ora'
import { klona } from 'klona/json'
import { resolveFrom, lookupFile, toArray, isStaticAsset } from '../utils'
import {
  rollup as Rollup,
  RollupOutput,
  ExternalOption,
  Plugin,
  InputOptions,
  RollupBuild
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
import { stopService } from '../esbuildService'
import { BuildConfig, defaultDefines } from '../config'
import { createBuildJsTransformPlugin } from '../transform'
import hash_sum from 'hash-sum'
import { resolvePostcssOptions, isCSSRequest } from '../utils/cssUtils'
import { createBuildWasmPlugin } from './buildPluginWasm'
import { createBuildManifestPlugin } from './buildPluginManifest'

interface Build {
  id: string
  bundle: Promise<RollupBuild>
  html?: string
  assets?: RollupOutput['output']
}

/** For adding Rollup builds and mutating the Vite config. */
export type BuildPlugin = (
  config: BuildConfig,
  builds: Build[]
) => PostBuildHook | void

/** Returned by `configureBuild` hook to mutate a build's output. */
export type PostBuildHook = (build: Required<Build>) => Promise<void> | void

export interface BuildResult {
  id: string
  html: string
  assets: RollupOutput['output']
}

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
 * Bundles the app for production.
 * Returns a Promise containing the build result.
 */
export async function build(
  options: Partial<BuildConfig>
): Promise<BuildResult[]> {
  const builds: Build[] = []

  const config = prepareConfig(options)
  const postBuildHooks = toArray(config.configureBuild)
    .map((configureBuild) => configureBuild(config, builds))
    .filter(Boolean) as PostBuildHook[]

  const {
    root,
    assetsDir,
    assetsInlineLimit,
    entry,
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
  const start = Date.now()
  const emitIndex = !!(config.emitIndex && write)
  const emitAssets = !!(config.emitAssets && write)

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
  const indexPath = path.resolve(root, 'index.html')
  const publicBasePath = config.base.replace(/([^/])$/, '$1/') // ensure ending slash
  const resolvedAssetsPath = path.join(outDir, assetsDir)
  const resolver = createResolver(
    root,
    config.resolvers,
    config.alias,
    config.assetsInclude
  )

  if (write) {
    await fs.emptyDir(outDir)
  }

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

  // lazy require rollup so that we don't load it when only using the dev server
  // importing it just for the types
  const rollup = require('rollup').rollup as typeof Rollup
  const bundle = rollup({
    input: path.resolve(root, entry),
    preserveEntrySignatures: false,
    treeshake: { moduleSideEffects: 'no-external' },
    onwarn: onRollupWarning(spinner, config.optimizeDeps),
    ...rollupInputOptions,
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
        modulesOptions: config.cssModuleOptions,
        emitAssets
      }),
      // vite:asset
      createBuildAssetPlugin(
        root,
        resolver,
        publicBasePath,
        assetsDir,
        assetsInlineLimit,
        emitAssets
      ),
      createBuildWasmPlugin(
        root,
        publicBasePath,
        assetsDir,
        assetsInlineLimit,
        emitAssets
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

  builds.unshift({
    id: 'index',
    bundle
  })

  for (const build of builds) {
    const bundle = await build.bundle
    const { output } = await bundle[write ? 'write' : 'generate']({
      dir: resolvedAssetsPath,
      format: 'es',
      sourcemap,
      entryFileNames: `[name].[hash].js`,
      chunkFileNames: `[name].[hash].js`,
      assetFileNames: `[name].[hash].[ext]`,
      ...config.rollupOutputOptions
    })
    build.html = await renderIndex(output)
    build.assets = output
    await postBuildHooks.reduce(
      (queue, hook) => queue.then(() => hook(build as any)),
      Promise.resolve()
    )
  }

  spinner && spinner.stop()

  if (write) {
    const printFilesInfo = async (
      filepath: string,
      content: string | Uint8Array,
      type: WriteType
    ) => {
      if (!silent) {
        const needCompression =
          type === WriteType.JS ||
          type === WriteType.CSS ||
          type === WriteType.HTML
        const compressed = needCompression
          ? `, brotli: ${(require('brotli-size').sync(content) / 1024).toFixed(
              2
            )}kb`
          : ``
        console.log(
          `${chalk.gray(`[write]`)} ${writeColors[type](
            path.relative(process.cwd(), filepath)
          )} ${(content.length / 1024).toFixed(2)}kb${compressed}`
        )
      }
    }

    // log js chunks and assets
    for (const build of builds) {
      for (const chunk of build.assets!) {
        if (chunk.type === 'chunk') {
          // write chunk
          const filepath = path.join(resolvedAssetsPath, chunk.fileName)
          await printFilesInfo(filepath, chunk.code, WriteType.JS)
          if (chunk.map) {
            await printFilesInfo(
              filepath + '.map',
              chunk.map.toString(),
              WriteType.SOURCE_MAP
            )
          }
        } else if (emitAssets) {
          if (!chunk.source) continue
          // log asset
          const filepath = path.join(resolvedAssetsPath, chunk.fileName)
          await printFilesInfo(
            filepath,
            chunk.source,
            chunk.fileName.endsWith('.css') ? WriteType.CSS : WriteType.ASSET
          )
        }
      }

      if (emitIndex && build.html) {
        const outputHtmlPath = path.join(outDir, build.id + '.html')
        await fs.writeFile(outputHtmlPath, build.html)
        await printFilesInfo(outputHtmlPath, build.html, WriteType.HTML)
      }
    }

    // copy over /public if it exists
    if (emitAssets) {
      const publicDir = path.resolve(root, 'public')
      if (fs.existsSync(publicDir)) {
        for (const file of await fs.readdir(publicDir)) {
          await fs.copy(path.join(publicDir, file), path.resolve(outDir, file))
        }
      }
    }
  }

  if (!silent) {
    console.log(
      `Build completed in ${((Date.now() - start) / 1000).toFixed(2)}s.\n`
    )
  }

  // stop the esbuild service after each build
  await stopService()

  return builds.map(
    (build): BuildResult => ({
      id: build.id,
      html: build.html!,
      assets: build.assets!
    })
  )
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
    assetsDir: '.',
    ...options,
    rollupPluginVueOptions: {
      ...rollupPluginVueOptions,
      target: 'node'
    },
    rollupInputOptions: {
      ...rollupInputOptions,
      external: resolveExternal(
        rollupInputOptions && rollupInputOptions.external
      )
    },
    rollupOutputOptions: {
      ...rollupOutputOptions,
      format: 'cjs',
      exports: 'named',
      entryFileNames: '[name].js',
      // 764 add `Symbol.toStringTag` when build es module into cjs chunk
      namespaceToStringTag: true
    },
    emitIndex: false,
    emitAssets: false,
    cssCodeSplit: false,
    minify: false
  })
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
