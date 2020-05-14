import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import { Ora } from 'ora'
import { resolveFrom } from '../utils'
import { rollup as Rollup, RollupOutput, ExternalOption, Plugin } from 'rollup'
import { createResolver, supportedExts, InternalResolver } from '../resolver'
import { createBuildResolvePlugin } from './buildPluginResolve'
import { createBuildHtmlPlugin } from './buildPluginHtml'
import { createBuildCssPlugin } from './buildPluginCss'
import { createBuildAssetPlugin } from './buildPluginAsset'
import { createEsbuildPlugin } from './buildPluginEsbuild'
import { createReplacePlugin } from './buildPluginReplace'
import { stopService } from '../esbuildService'
import { BuildConfig } from '../config'
import { createBuildJsTransformPlugin } from '../transform'

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

/**
 * Named exports detection logic from Snowpack
 * MIT License
 * https://github.com/pikapkg/snowpack/blob/master/LICENSE
 */
const PACKAGES_TO_AUTO_DETECT_EXPORTS = [
  path.join('react', 'index.js'),
  path.join('react-dom', 'index.js'),
  'react-is',
  'prop-types',
  'scheduler',
  'rxjs',
  'exenv',
  'body-scroll-lock'
]

function detectExports(root: string, id: string): string[] | undefined {
  try {
    const fileLoc = resolveFrom(root, id)
    if (fs.existsSync(fileLoc)) {
      return Object.keys(require(fileLoc)).filter((e) => e[0] !== '_')
    }
  } catch (err) {
    // ignore
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
  const { rollupInputOptions = {}, transforms = [] } = options

  // TODO allow user to configure known named exports
  const knownNamedExports: Record<string, string[]> = {}
  for (const id of PACKAGES_TO_AUTO_DETECT_EXPORTS) {
    knownNamedExports[id] =
      knownNamedExports[id] || detectExports(root, id) || []
  }

  return [
    // user plugins
    ...(rollupInputOptions.plugins || []),
    // vite:resolve
    createBuildResolvePlugin(root, resolver),
    // vite:esbuild
    await createEsbuildPlugin(options.minify === 'esbuild', options.jsx),
    // vue
    require('rollup-plugin-vue')({
      ...options.rollupPluginVueOptions,
      transformAssetUrls: {
        includeAbsolute: true
      },
      preprocessStyles: true,
      preprocessCustomRequire: (id: string) => require(resolveFrom(root, id)),
      compilerOptions: options.vueCompilerOptions
    }),
    require('@rollup/plugin-json')({
      preferConst: true,
      indent: '  ',
      compact: false,
      namedExports: true
    }),
    // user transforms
    ...(transforms.length ? [createBuildJsTransformPlugin(transforms)] : []),
    require('@rollup/plugin-node-resolve')({
      rootDir: root,
      extensions: supportedExts,
      preferBuiltins: false
    }),
    require('@rollup/plugin-commonjs')({
      extensions: ['.js', '.cjs'],
      namedExports: knownNamedExports
    })
  ].filter(Boolean)
}

/**
 * Bundles the app for production.
 * Returns a Promise containing the build result.
 */
export async function build(options: BuildConfig = {}): Promise<BuildResult> {
  if (options.ssr) {
    return ssrBuild({
      ...options,
      ssr: false // since ssrBuild calls build, this avoids an infinite loop.
    })
  }

  const isTest = process.env.NODE_ENV === 'test'
  process.env.NODE_ENV = 'production'
  const start = Date.now()

  const {
    root = process.cwd(),
    base = '/',
    outDir = path.resolve(root, 'dist'),
    assetsDir = 'assets',
    assetsInlineLimit = 4096,
    alias = {},
    transforms = [],
    resolvers = [],
    rollupInputOptions = {},
    rollupOutputOptions = {},
    emitIndex = true,
    emitAssets = true,
    write = true,
    minify = true,
    silent = false,
    sourcemap = false
  } = options

  let spinner: Ora | undefined
  const msg = 'Building for production...'
  if (!silent) {
    if (process.env.DEBUG || isTest) {
      console.log(msg)
    } else {
      spinner = require('ora')(msg + '\n').start()
    }
  }

  const indexPath = path.resolve(root, 'index.html')
  const publicBasePath = base.replace(/([^/])$/, '$1/') // ensure ending slash
  const resolvedAssetsPath = path.join(outDir, assetsDir)
  const cssFileName = 'style.css'

  const resolver = createResolver(root, resolvers, alias)

  const { htmlPlugin, renderIndex } = await createBuildHtmlPlugin(
    root,
    indexPath,
    publicBasePath,
    assetsDir,
    assetsInlineLimit,
    resolver
  )

  const basePlugins = await createBaseRollupPlugins(root, resolver, options)

  // lazy require rollup so that we don't load it when only using the dev server
  // importing it just for the types
  const rollup = require('rollup').rollup as typeof Rollup
  const bundle = await rollup({
    input: path.resolve(root, 'index.html'),
    preserveEntrySignatures: false,
    treeshake: { moduleSideEffects: 'no-external' },
    onwarn(warning, warn) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        warn(warning)
      }
    },
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
        {
          'process.env.NODE_ENV': '"production"',
          'process.env.': `({}).`,
          __DEV__: 'false',
          __BASE__: JSON.stringify(publicBasePath)
        },
        sourcemap
      ),
      // vite:css
      createBuildCssPlugin(
        root,
        publicBasePath,
        assetsDir,
        cssFileName,
        !!minify,
        assetsInlineLimit,
        transforms
      ),
      // vite:asset
      createBuildAssetPlugin(
        root,
        publicBasePath,
        assetsDir,
        assetsInlineLimit
      ),
      // minify with terser
      // this is the default which has better compression, but slow
      // the user can opt-in to use esbuild which is much faster but results
      // in ~8-10% larger file size.
      minify && minify !== 'esbuild'
        ? require('rollup-plugin-terser').terser()
        : undefined
    ]
  })

  const { output } = await bundle.generate({
    format: 'es',
    sourcemap,
    ...rollupOutputOptions
  })

  spinner && spinner.stop()

  const indexHtml = emitIndex ? renderIndex(output, cssFileName) : ''

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
        console.log(
          `${chalk.gray(`[write]`)} ${writeColors[type](
            path.relative(cwd, filepath)
          )} ${(content.length / 1024).toFixed(2)}kb, brotli: ${(
            require('brotli-size').sync(content) / 1024
          ).toFixed(2)}kb`
        )
      }
    }

    await fs.remove(outDir)
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
        await fs.copy(publicDir, path.resolve(outDir, 'public'))
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
export async function ssrBuild(
  options: BuildConfig = {}
): Promise<BuildResult> {
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
      exports: 'named'
    },
    emitIndex: false,
    emitAssets: false,
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
