import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { Ora } from 'ora'
import { resolveFrom, lookupFile } from '../utils'
import {
  rollup as Rollup,
  RollupOutput,
  ExternalOption,
  Plugin,
  InputOptions
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
import { createEsbuildPlugin } from './buildPluginEsbuild'
import { createReplacePlugin } from './buildPluginReplace'
import { stopService } from '../esbuildService'
import { BuildConfig, defaultDefines } from '../config'
import { createBuildJsTransformPlugin } from '../transform'
import hash_sum from 'hash-sum'
import { resolvePostcssOptions } from '../utils/cssUtils'
import { createBuildWasmPlugin } from './buildPluginWasm'

export interface BuildResult {
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
        const allowList = options && options.allowNodeBuiltins
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
  options: BuildConfig
): Promise<Plugin[]> {
  const {
    rollupInputOptions = {},
    transforms = [],
    vueCustomBlockTransforms = {},
    enableEsbuild = true,
    enableRollupPluginVue = true
  } = options
  const { nodeResolve } = require('@rollup/plugin-node-resolve')
  const dynamicImport = require('rollup-plugin-dynamic-import-variables')

  return [
    // user plugins
    ...(rollupInputOptions.plugins || []),
    // vite:resolve
    createBuildResolvePlugin(root, resolver),
    // vite:esbuild
    enableEsbuild
      ? await createEsbuildPlugin(options.minify === 'esbuild', options.jsx)
      : null,
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
    transformAssetUrls = {}
  }: BuildConfig
) {
  const {
    options: postcssOptions,
    plugins: postcssPlugins
  } = await resolvePostcssOptions(root, true)

  if (typeof transformAssetUrls === 'object') {
    transformAssetUrls = {
      includeAbsolute: true,
      ...transformAssetUrls
    }
  }

  return require('rollup-plugin-vue')({
    ...rollupPluginVueOptions,
    transformAssetUrls,
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
 * Bundles the app for production.
 * Returns a Promise containing the build result.
 */
export async function build(options: BuildConfig): Promise<BuildResult> {
  const {
    root = process.cwd(),
    base = '/',
    outDir = path.resolve(root, 'dist'),
    assetsDir = '_assets',
    assetsInlineLimit = 4096,
    cssCodeSplit = true,
    alias = {},
    resolvers = [],
    rollupInputOptions = {},
    rollupOutputOptions = {},
    emitIndex = true,
    emitAssets = true,
    write = true,
    minify = true,
    silent = false,
    sourcemap = false,
    shouldPreload = null,
    env = {},
    mode = 'production',
    define: userDefineReplacements,
    cssPreprocessOptions,
    cssModuleOptions = {}
  } = options

  const isTest = process.env.NODE_ENV === 'test'
  process.env.NODE_ENV = mode
  const start = Date.now()

  let spinner: Ora | undefined
  const msg = 'Building for production...'
  if (!silent) {
    if (process.env.DEBUG || isTest) {
      console.log(msg)
    } else {
      spinner = require('ora')(msg + '\n').start()
    }
  }
  await fs.remove(outDir)

  const indexPath = path.resolve(root, 'index.html')
  const publicBasePath = base.replace(/([^/])$/, '$1/') // ensure ending slash
  const resolvedAssetsPath = path.join(outDir, assetsDir)

  const resolver = createResolver(root, resolvers, alias)

  const { htmlPlugin, renderIndex } = await createBuildHtmlPlugin(
    root,
    indexPath,
    publicBasePath,
    assetsDir,
    assetsInlineLimit,
    resolver,
    shouldPreload
  )

  const basePlugins = await createBaseRollupPlugins(root, resolver, options)

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
      preserveSource: true // somehow results in slightly smaller bundle
    })
  )

  // user env variables loaded from .env files.
  // only those prefixed with VITE_ are exposed.
  const userEnvReplacements = Object.keys(env).reduce((replacements, key) => {
    if (key.startsWith(`VITE_`)) {
      replacements[`import.meta.env.${key}`] = JSON.stringify(env[key])
    }
    return replacements
  }, {} as Record<string, string>)

  // lazy require rollup so that we don't load it when only using the dev server
  // importing it just for the types
  const rollup = require('rollup').rollup as typeof Rollup
  const bundle = await rollup({
    input: path.resolve(root, 'index.html'),
    preserveEntrySignatures: false,
    treeshake: { moduleSideEffects: 'no-external' },
    onwarn: onRollupWarning(spinner, options.optimizeDeps),
    ...rollupInputOptions,
    plugins: [
      ...basePlugins,
      // vite:html
      htmlPlugin,
      // we use a custom replacement plugin because @rollup/plugin-replace
      // performs replacements twice, once at transform and once at renderChunk
      // - which makes it impossible to exclude Vue templates from it since
      // Vue templates are compiled into js and included in chunks.
      createReplacePlugin(
        (id) => /\.(j|t)sx?$/.test(id) || id.startsWith(`/vite/`),
        {
          ...userEnvReplacements,
          ...defaultDefines,
          ...userDefineReplacements,
          'import.meta.env.BASE_URL': JSON.stringify(publicBasePath),
          'import.meta.env.MODE': JSON.stringify(mode),
          'import.meta.env.DEV': String(mode === 'development'),
          'import.meta.env.PROD': String(mode === 'production'),
          'import.meta.env.': `({}).`,
          'process.env.NODE_ENV': JSON.stringify(mode),
          'process.env.': `({}).`,
          'import.meta.hot': `false`
        },
        sourcemap
      ),
      // vite:css
      createBuildCssPlugin({
        root,
        publicBase: publicBasePath,
        assetsDir,
        minify,
        inlineLimit: assetsInlineLimit,
        cssCodeSplit,
        preprocessOptions: cssPreprocessOptions,
        modulesOptions: cssModuleOptions
      }),
      // vite:asset
      createBuildAssetPlugin(
        root,
        publicBasePath,
        assetsDir,
        assetsInlineLimit
      ),
      createBuildWasmPlugin(root, publicBasePath, assetsDir, assetsInlineLimit),
      // minify with terser
      // this is the default which has better compression, but slow
      // the user can opt-in to use esbuild which is much faster but results
      // in ~8-10% larger file size.
      minify && minify !== 'esbuild'
        ? require('rollup-plugin-terser').terser()
        : undefined
    ].filter(Boolean)
  })

  const { output } = await bundle.generate({
    format: 'es',
    sourcemap,
    entryFileNames: `[name].[hash].js`,
    chunkFileNames: `[name].[hash].js`,
    ...rollupOutputOptions
  })

  spinner && spinner.stop()

  const indexHtml = emitIndex ? renderIndex(output) : ''

  if (write) {
    const cwd = process.cwd()
    const writeFile = async (
      filepath: string,
      content: string | Uint8Array,
      type: WriteType
    ) => {
      await fs.ensureDir(path.dirname(filepath))
      await fs.writeFile(filepath, content)
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
            path.relative(cwd, filepath)
          )} ${(content.length / 1024).toFixed(2)}kb${compressed}`
        )
      }
    }

    await fs.ensureDir(outDir)

    // write js chunks and assets
    for (const chunk of output) {
      if (chunk.type === 'chunk') {
        // write chunk
        const filepath = path.join(resolvedAssetsPath, chunk.fileName)
        let code = chunk.code
        if (chunk.map) {
          code += `\n//# sourceMappingURL=${path.basename(filepath)}.map`
        }
        await writeFile(filepath, code, WriteType.JS)
        if (chunk.map) {
          await writeFile(
            filepath + '.map',
            chunk.map.toString(),
            WriteType.SOURCE_MAP
          )
        }
      } else if (emitAssets) {
        if (!chunk.source) continue
        // write asset
        const filepath = path.join(resolvedAssetsPath, chunk.fileName)
        await writeFile(
          filepath,
          chunk.source,
          chunk.fileName.endsWith('.css') ? WriteType.CSS : WriteType.ASSET
        )
      }
    }

    // write html
    if (indexHtml && emitIndex) {
      await writeFile(
        path.join(outDir, 'index.html'),
        indexHtml,
        WriteType.HTML
      )
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
  stopService()

  return {
    assets: output,
    html: indexHtml
  }
}

/**
 * Bundles the app in SSR mode.
 * - All Vue dependencies are automatically externalized
 * - Imports to dependencies are compiled into require() calls
 * - Templates are compiled with SSR specific optimizations.
 */
export async function ssrBuild(options: BuildConfig): Promise<BuildResult> {
  const {
    rollupInputOptions,
    rollupOutputOptions,
    rollupPluginVueOptions
  } = options

  return build({
    outDir: path.resolve(options.root || process.cwd(), 'dist-ssr'),
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
      entryFileNames: '[name].js'
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
