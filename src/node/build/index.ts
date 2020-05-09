import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import resolve from 'resolve-from'
import { rollup as Rollup, RollupOutput, ExternalOption } from 'rollup'
import { createResolver, supportedExts } from '../resolver'
import { createBuildResolvePlugin } from './buildPluginResolve'
import { createBuildHtmlPlugin } from './buildPluginHtml'
import { createBuildCssPlugin } from './buildPluginCss'
import { createBuildAssetPlugin } from './buildPluginAsset'
import { createEsbuildPlugin } from './buildPluginEsbuild'
import { createReplacePlugin } from './buildPluginReplace'
import { stopService } from '../esbuildService'
import { BuildConfig } from '../config'

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

  process.env.NODE_ENV = 'production'
  const start = Date.now()

  const {
    root = process.cwd(),
    base = '/',
    outDir = path.resolve(root, 'dist'),
    assetsDir = 'assets',
    assetsInlineLimit = 4096,
    resolvers = [],
    vueCompilerOptions,
    rollupInputOptions = {},
    rollupOutputOptions = {},
    rollupPluginVueOptions = {},
    jsx = {},
    emitIndex = true,
    emitAssets = true,
    write = true,
    minify = true,
    silent = false,
    sourcemap = false
  } = options

  const indexPath = path.resolve(root, 'index.html')
  const publicBasePath = base.replace(/([^/])$/, '$1/') // ensure ending slash
  const resolvedAssetsPath = path.join(outDir, assetsDir)
  const cssFileName = 'style.css'

  const resolver = createResolver(root, resolvers)

  const { htmlPlugin, renderIndex } = await createBuildHtmlPlugin(
    root,
    indexPath,
    publicBasePath,
    assetsDir,
    assetsInlineLimit,
    resolver
  )

  // lazy require rollup so that we don't load it when only using the dev server
  // importing it just for the types
  const rollup = require('rollup').rollup as typeof Rollup
  const bundle = await rollup({
    input: path.resolve(root, 'index.html'),
    preserveEntrySignatures: false,
    ...rollupInputOptions,
    plugins: [
      // user plugins
      ...(rollupInputOptions.plugins || []),
      // vite:resolve
      createBuildResolvePlugin(root, resolver),
      // vite:html
      ...(htmlPlugin ? [htmlPlugin] : []),
      // vite:esbuild
      await createEsbuildPlugin(minify === 'esbuild', jsx),
      // vue
      require('rollup-plugin-vue')({
        ...rollupPluginVueOptions,
        transformAssetUrls: {
          includeAbsolute: true
        },
        preprocessStyles: true,
        preprocessCustomRequire: (id: string) => require(resolve(root, id)),
        compilerOptions: vueCompilerOptions
      }),
      require('@rollup/plugin-json')(),
      require('@rollup/plugin-node-resolve')({
        rootDir: root,
        extensions: supportedExts
      }),
      // we use a custom replacement plugin because @rollup/plugin-replace
      // performs replacements twice, once at transform and once at renderChunk
      // - which makes it impossible to exclude Vue templates from it since
      // Vue templates are compiled into js and included in chunks.
      createReplacePlugin(
        {
          'process.env.NODE_ENV': '"production"',
          __DEV__: 'false'
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
        assetsInlineLimit
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
      ...(minify && minify !== 'esbuild'
        ? [require('rollup-plugin-terser').terser()]
        : [])
    ],
    onwarn(warning, warn) {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        warn(warning)
      }
    }
  })

  const { output } = await bundle.generate({
    format: 'es',
    sourcemap,
    ...rollupOutputOptions
  })

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
      if (await fs.pathExists(publicDir)) {
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
