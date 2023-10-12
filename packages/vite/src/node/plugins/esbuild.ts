import path from 'node:path'
import colors from 'picocolors'
import type {
  Loader,
  Message,
  TransformOptions,
  TransformResult,
} from 'esbuild'
import { transform } from 'esbuild'
import type { RawSourceMap } from '@ampproject/remapping'
import type { InternalModuleFormat, SourceMap } from 'rollup'
import type { TSConfckParseResult } from 'tsconfck'
import { TSConfckCache, TSConfckParseError, parse } from 'tsconfck'
import {
  cleanUrl,
  combineSourcemaps,
  createDebugger,
  createFilter,
  ensureWatchedFile,
  generateCodeFrame,
} from '../utils'
import type { ViteDevServer } from '../server'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'

const debug = createDebugger('vite:esbuild')

// IIFE content looks like `var MyLib = function() {`.
// Spaces are removed and parameters are mangled when minified
const IIFE_BEGIN_RE =
  /(const|var)\s+\S+\s*=\s*function\([^()]*\)\s*\{\s*"use strict";/

const validExtensionRE = /\.\w+$/
const jsxExtensionsRE = /\.(?:j|t)sx\b/

let server: ViteDevServer

export interface ESBuildOptions extends TransformOptions {
  include?: string | RegExp | string[] | RegExp[]
  exclude?: string | RegExp | string[] | RegExp[]
  jsxInject?: string
  /**
   * This option is not respected. Use `build.minify` instead.
   */
  minify?: never
}

export type ESBuildTransformResult = Omit<TransformResult, 'map'> & {
  map: SourceMap
}

type TSConfigJSON = {
  extends?: string
  compilerOptions?: {
    alwaysStrict?: boolean
    experimentalDecorators?: boolean
    importsNotUsedAsValues?: 'remove' | 'preserve' | 'error'
    jsx?: 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev'
    jsxFactory?: string
    jsxFragmentFactory?: string
    jsxImportSource?: string
    preserveValueImports?: boolean
    target?: string
    useDefineForClassFields?: boolean
    verbatimModuleSyntax?: boolean
  }
  [key: string]: any
}
type TSCompilerOptions = NonNullable<TSConfigJSON['compilerOptions']>

export async function transformWithEsbuild(
  code: string,
  filename: string,
  options?: TransformOptions,
  inMap?: object,
): Promise<ESBuildTransformResult> {
  let loader = options?.loader

  if (!loader) {
    // if the id ends with a valid ext, use it (e.g. vue blocks)
    // otherwise, cleanup the query before checking the ext
    const ext = path
      .extname(validExtensionRE.test(filename) ? filename : cleanUrl(filename))
      .slice(1)

    if (ext === 'cjs' || ext === 'mjs') {
      loader = 'js'
    } else if (ext === 'cts' || ext === 'mts') {
      loader = 'ts'
    } else {
      loader = ext as Loader
    }
  }

  let tsconfigRaw = options?.tsconfigRaw
  const fallbackSupported: Record<string, boolean> = {}

  // if options provide tsconfigRaw in string, it takes highest precedence
  if (typeof tsconfigRaw !== 'string') {
    // these fields would affect the compilation result
    // https://esbuild.github.io/content-types/#tsconfig-json
    const meaningfulFields: Array<keyof TSCompilerOptions> = [
      'alwaysStrict',
      'experimentalDecorators',
      'importsNotUsedAsValues',
      'jsx',
      'jsxFactory',
      'jsxFragmentFactory',
      'jsxImportSource',
      'preserveValueImports',
      'target',
      'useDefineForClassFields',
      'verbatimModuleSyntax',
    ]
    const compilerOptionsForFile: TSCompilerOptions = {}
    if (loader === 'ts' || loader === 'tsx') {
      const loadedTsconfig = await loadTsconfigJsonForFile(filename)
      const loadedCompilerOptions = loadedTsconfig.compilerOptions ?? {}

      for (const field of meaningfulFields) {
        if (field in loadedCompilerOptions) {
          // @ts-expect-error TypeScript can't tell they are of the same type
          compilerOptionsForFile[field] = loadedCompilerOptions[field]
        }
      }
    }

    const compilerOptions = {
      ...compilerOptionsForFile,
      ...tsconfigRaw?.compilerOptions,
    }

    // esbuild uses `useDefineForClassFields: true` when `tsconfig.compilerOptions.target` isn't declared
    // but we want `useDefineForClassFields: false` when `tsconfig.compilerOptions.target` isn't declared
    // to align with the TypeScript's behavior
    if (
      compilerOptions.useDefineForClassFields === undefined &&
      compilerOptions.target === undefined
    ) {
      compilerOptions.useDefineForClassFields = false
    }

    // esbuild v0.18 only transforms decorators when `experimentalDecorators` is set to `true`.
    // To preserve compat with the esbuild breaking change, we set `experimentalDecorators` to
    // `true` by default if it's unset.
    // TODO: Remove this in Vite 5
    if (compilerOptions.experimentalDecorators === undefined) {
      compilerOptions.experimentalDecorators = true
    }

    // Compat with esbuild 0.17 where static properties are transpiled to
    // static blocks when `useDefineForClassFields` is false. Its support
    // is not great yet, so temporarily disable it for now.
    // TODO: Remove this in Vite 5, don't pass hardcoded `esnext` target
    // to `transformWithEsbuild` in the esbuild plugin.
    if (compilerOptions.useDefineForClassFields !== true) {
      fallbackSupported['class-static-blocks'] = false
    }

    // esbuild uses tsconfig fields when both the normal options and tsconfig was set
    // but we want to prioritize the normal options
    if (options) {
      options.jsx && (compilerOptions.jsx = undefined)
      options.jsxFactory && (compilerOptions.jsxFactory = undefined)
      options.jsxFragment && (compilerOptions.jsxFragmentFactory = undefined)
      options.jsxImportSource && (compilerOptions.jsxImportSource = undefined)
    }

    tsconfigRaw = {
      ...tsconfigRaw,
      compilerOptions,
    }
  }

  const resolvedOptions: TransformOptions = {
    sourcemap: true,
    // ensure source file name contains full query
    sourcefile: filename,
    ...options,
    loader,
    tsconfigRaw,
    supported: {
      ...fallbackSupported,
      ...options?.supported,
    },
  }

  // Some projects in the ecosystem are calling this function with an ESBuildOptions
  // object and esbuild throws an error for extra fields
  // @ts-expect-error include exists in ESBuildOptions
  delete resolvedOptions.include
  // @ts-expect-error exclude exists in ESBuildOptions
  delete resolvedOptions.exclude
  // @ts-expect-error jsxInject exists in ESBuildOptions
  delete resolvedOptions.jsxInject

  try {
    const result = await transform(code, resolvedOptions)
    let map: SourceMap
    if (inMap && resolvedOptions.sourcemap) {
      const nextMap = JSON.parse(result.map)
      nextMap.sourcesContent = []
      map = combineSourcemaps(filename, [
        nextMap as RawSourceMap,
        inMap as RawSourceMap,
      ]) as SourceMap
    } else {
      map =
        resolvedOptions.sourcemap && resolvedOptions.sourcemap !== 'inline'
          ? JSON.parse(result.map)
          : { mappings: '' }
    }
    return {
      ...result,
      map,
    }
  } catch (e: any) {
    debug?.(`esbuild error with options used: `, resolvedOptions)
    // patch error information
    if (e.errors) {
      e.frame = ''
      e.errors.forEach((m: Message) => {
        if (m.text === 'Experimental decorators are not currently enabled') {
          m.text +=
            '. Vite 4.4+ now uses esbuild 0.18 and you need to enable them by adding "experimentalDecorators": true in your "tsconfig.json" file.'
        }
        e.frame += `\n` + prettifyMessage(m, code)
      })
      e.loc = e.errors[0].location
    }
    throw e
  }
}

export function esbuildPlugin(config: ResolvedConfig): Plugin {
  const options = config.esbuild as ESBuildOptions
  const { jsxInject, include, exclude, ...esbuildTransformOptions } = options

  const filter = createFilter(include || /\.(m?ts|[jt]sx)$/, exclude || /\.js$/)

  // Remove optimization options for dev as we only need to transpile them,
  // and for build as the final optimization is in `buildEsbuildPlugin`
  const transformOptions: TransformOptions = {
    target: 'esnext',
    charset: 'utf8',
    ...esbuildTransformOptions,
    minify: false,
    minifyIdentifiers: false,
    minifySyntax: false,
    minifyWhitespace: false,
    treeShaking: false
  }

  return {
    name: 'vite:esbuild',
    configureServer(_server) {
      server = _server
      server.watcher
        .on('add', reloadOnTsconfigChange)
        .on('change', reloadOnTsconfigChange)
        .on('unlink', reloadOnTsconfigChange)
    },
    buildEnd() {
      // recycle serve to avoid preventing Node self-exit (#6815)
      server = null as any
    },
    async transform(code, id) {
      if (filter(id) || filter(cleanUrl(id))) {
        const result = await transformWithEsbuild(code, id, transformOptions)
        if (result.warnings.length) {
          result.warnings.forEach((m) => {
            this.warn(prettifyMessage(m, code))
          })
        }
        if (jsxInject && jsxExtensionsRE.test(id)) {
          result.code = jsxInject + ';' + result.code
        }
        return {
          code: result.code,
          map: result.map,
        }
      }
    },
  }
}

const rollupToEsbuildFormatMap: Record<
  string,
  TransformOptions['format'] | undefined
> = {
  es: 'esm',
  cjs: 'cjs',

  // passing `var Lib = (() => {})()` to esbuild with format = "iife"
  // will turn it to `(() => { var Lib = (() => {})() })()`,
  // so we remove the format config to tell esbuild not doing this
  //
  // although esbuild doesn't change format, there is still possibility
  // that `{ treeShaking: true }` removes a top-level no-side-effect variable
  // like: `var Lib = 1`, which becomes `` after esbuild transforming,
  // but thankfully rollup does not do this optimization now
  iife: undefined,
}

export const buildEsbuildPlugin = (config: ResolvedConfig): Plugin => {
  return {
    name: 'vite:esbuild-transpile',
    async renderChunk(code, chunk, opts) {
      // @ts-expect-error injected by @vitejs/plugin-legacy
      if (opts.__vite_skip_esbuild__) {
        return null
      }

      const options = resolveEsbuildTranspileOptions(config, opts.format)

      if (!options) {
        return null
      }

      const res = await transformWithEsbuild(code, chunk.fileName, options)

      if (config.build.lib) {
        // #7188, esbuild adds helpers out of the UMD and IIFE wrappers, and the
        // names are minified potentially causing collision with other globals.
        // We inject the helpers inside the wrappers.
        // e.g. turn:
        //    <esbuild helpers> (function(){ /*actual content/* })()
        // into:
        //    (function(){ <esbuild helpers> /*actual content/* })()
        // Not using regex because it's too hard to rule out performance issues like #8738 #8099 #10900 #14065
        // Instead, using plain string index manipulation (indexOf, slice) which is simple and performant
        // We don't need to create a MagicString here because both the helpers and
        // the headers don't modify the sourcemap
        const esbuildCode = res.code
        const contentIndex =
          opts.format === 'iife'
            ? esbuildCode.match(IIFE_BEGIN_RE)?.index || 0
            : opts.format === 'umd'
            ? esbuildCode.indexOf(`(function(`) // same for minified or not
            : 0
        if (contentIndex > 0) {
          const esbuildHelpers = esbuildCode.slice(0, contentIndex)
          res.code = esbuildCode
            .slice(contentIndex)
            .replace(`"use strict";`, `"use strict";` + esbuildHelpers)
        }
      }

      return res
    },
  }
}

export function resolveEsbuildTranspileOptions(
  config: ResolvedConfig,
  format: InternalModuleFormat,
): TransformOptions | null {
  const target = config.build.target
  const minify = config.build.minify === 'esbuild'

  if ((!target || target === 'esnext') && !minify) {
    return null
  }

  // Do not minify whitespace for ES lib output since that would remove
  // pure annotations and break tree-shaking
  // https://github.com/vuejs/core/issues/2860#issuecomment-926882793
  const isEsLibBuild = config.build.lib && format === 'es'
  const esbuildOptions = config.esbuild || {}

  const options: TransformOptions = {
    charset: 'utf8',
    ...esbuildOptions,
    target: target || undefined,
    format: rollupToEsbuildFormatMap[format],
    // the final build should always support dynamic import and import.meta.
    // if they need to be polyfilled, plugin-legacy should be used.
    // plugin-legacy detects these two features when checking for modern code.
    supported: {
      'dynamic-import': true,
      'import-meta': true,
      ...esbuildOptions.supported,
    },
  }

  // If no minify, disable all minify options
  if (!minify) {
    return {
      ...options,
      minify: false,
      minifyIdentifiers: false,
      minifySyntax: false,
      minifyWhitespace: false,
      treeShaking: false,
    }
  }

  // If user enable fine-grain minify options, minify with their options instead
  if (
    options.minifyIdentifiers != null ||
    options.minifySyntax != null ||
    options.minifyWhitespace != null
  ) {
    if (isEsLibBuild) {
      // Disable minify whitespace as it breaks tree-shaking
      return {
        ...options,
        minify: false,
        minifyIdentifiers: options.minifyIdentifiers ?? true,
        minifySyntax: options.minifySyntax ?? true,
        minifyWhitespace: false,
        treeShaking: true,
      }
    } else {
      return {
        ...options,
        minify: false,
        minifyIdentifiers: options.minifyIdentifiers ?? true,
        minifySyntax: options.minifySyntax ?? true,
        minifyWhitespace: options.minifyWhitespace ?? true,
        treeShaking: true,
      }
    }
  }

  // Else apply default minify options
  if (isEsLibBuild) {
    // Minify all except whitespace as it breaks tree-shaking
    return {
      ...options,
      minify: false,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: false,
      treeShaking: true,
    }
  } else {
    return {
      ...options,
      minify: true,
      treeShaking: true,
    }
  }
}

function prettifyMessage(m: Message, code: string): string {
  let res = colors.yellow(m.text)
  if (m.location) {
    const lines = code.split(/\r?\n/g)
    const line = Number(m.location.line)
    const column = Number(m.location.column)
    const offset =
      lines
        .slice(0, line - 1)
        .map((l) => l.length)
        .reduce((total, l) => total + l + 1, 0) + column
    res += `\n` + generateCodeFrame(code, offset, offset + 1)
  }
  return res + `\n`
}

let tsconfckCache: TSConfckCache<TSConfckParseResult>

async function loadTsconfigJsonForFile(
  filename: string,
): Promise<TSConfigJSON> {
  try {
    if (tsconfckCache) {
      // shortcut, the cache stores resolved TSConfckParseResult
      // so getting it from the cache directly we bypass aysnc fn call wrapping it in a promise again
      if (tsconfckCache.hasParseResult(filename)) {
        const result = await tsconfckCache.getParseResult(filename)
        return result.tsconfig
      }
    } else {
      tsconfckCache = new TSConfckCache<TSConfckParseResult>()
    }
    const result = await parse(filename, {
      cache: tsconfckCache,
      ignoreNodeModules: true,
    })
    // tsconfig could be out of root, make sure it is watched on dev
    if (server && result.tsconfigFile) {
      ensureWatchedFile(server.watcher, result.tsconfigFile, server.config.root)
    }
    return result.tsconfig
  } catch (e) {
    if (e instanceof TSConfckParseError) {
      // tsconfig could be out of root, make sure it is watched on dev
      if (server && e.tsconfigFile) {
        ensureWatchedFile(server.watcher, e.tsconfigFile, server.config.root)
      }
    }
    throw e
  }
}

async function reloadOnTsconfigChange(changedFile: string) {
  // server could be closed externally after a file change is detected
  if (!server) return
  // any tsconfig.json that's added in the workspace could be closer to a code file than a previously cached one
  // any json file in the tsconfig cache could have been used to compile ts
  if (
    path.basename(changedFile) === 'tsconfig.json' ||
    (changedFile.endsWith('.json') &&
      tsconfckCache?.hasParseResult(changedFile))
  ) {
    server.config.logger.info(
      `changed tsconfig file detected: ${changedFile} - Clearing cache and forcing full-reload to ensure TypeScript is compiled with updated config values.`,
      { clear: server.config.clearScreen, timestamp: true },
    )

    // clear module graph to remove code compiled with outdated config
    server.moduleGraph.invalidateAll()

    // reset tsconfck so that recompile works with up2date configs
    tsconfckCache.clear()

    // server may not be available if vite config is updated at the same time
    if (server) {
      // force full reload
      server.ws.send({
        type: 'full-reload',
        path: '*',
      })
    }
  }
}
