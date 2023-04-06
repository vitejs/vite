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
import type { TSConfckParseOptions } from 'tsconfck'
import { TSConfckParseError, findAll, parse } from 'tsconfck'
import {
  cleanUrl,
  combineSourcemaps,
  createDebugger,
  createFilter,
  ensureWatchedFile,
  generateCodeFrame,
  timeFrom,
} from '../utils'
import type { ResolvedConfig, ViteDevServer } from '..'
import type { Plugin } from '../plugin'
import { searchForWorkspaceRoot } from '..'

const debug = createDebugger('vite:esbuild')

const INJECT_HELPERS_IIFE_RE =
  /^(.*?)((?:const|var)\s+\S+\s*=\s*function\s*\([^)]*\)\s*\{.*?"use strict";)/s
const INJECT_HELPERS_UMD_RE =
  /^(.*?)(\(function\([^)]*\)\s*\{.+?amd.+?function\([^)]*\)\s*\{.*?"use strict";)/s

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
    importsNotUsedAsValues?: 'remove' | 'preserve' | 'error'
    jsx?: 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev'
    jsxFactory?: string
    jsxFragmentFactory?: string
    jsxImportSource?: string
    preserveValueImports?: boolean
    target?: string
    useDefineForClassFields?: boolean
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

  // if options provide tsconfigRaw in string, it takes highest precedence
  if (typeof tsconfigRaw !== 'string') {
    // these fields would affect the compilation result
    // https://esbuild.github.io/content-types/#tsconfig-json
    const meaningfulFields: Array<keyof TSCompilerOptions> = [
      'alwaysStrict',
      'importsNotUsedAsValues',
      'jsx',
      'jsxFactory',
      'jsxFragmentFactory',
      'jsxImportSource',
      'preserveValueImports',
      'target',
      'useDefineForClassFields',
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

    // esbuild derives `useDefineForClassFields` from `target` instead of `tsconfig.compilerOptions.target`
    // https://github.com/evanw/esbuild/issues/2584
    // but we want `useDefineForClassFields` to be derived from `tsconfig.compilerOptions.target`
    if (compilerOptions.useDefineForClassFields === undefined) {
      const lowercaseTarget = compilerOptions.target?.toLowerCase() ?? 'es3'
      if (lowercaseTarget.startsWith('es')) {
        const esVersion = lowercaseTarget.slice(2)
        compilerOptions.useDefineForClassFields =
          esVersion === 'next' || +esVersion >= 2022
      } else {
        compilerOptions.useDefineForClassFields = false
      }
    }

    // esbuild uses tsconfig fields when both the normal options and tsconfig was set
    // but we want to prioritize the normal options
    if (options) {
      options.jsx && (compilerOptions.jsx = undefined)
      options.jsxFactory && (compilerOptions.jsxFactory = undefined)
      options.jsxFragment && (compilerOptions.jsxFragmentFactory = undefined)
      options.jsxImportSource && (compilerOptions.jsxImportSource = undefined)
      options.target && (compilerOptions.target = undefined)
    }

    tsconfigRaw = {
      ...tsconfigRaw,
      compilerOptions,
    }
  }

  const resolvedOptions = {
    sourcemap: true,
    // ensure source file name contains full query
    sourcefile: filename,
    ...options,
    loader,
    tsconfigRaw,
  } as ESBuildOptions

  // Some projects in the ecosystem are calling this function with an ESBuildOptions
  // object and esbuild throws an error for extra fields
  delete resolvedOptions.include
  delete resolvedOptions.exclude
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
    treeShaking: false,
    // keepNames is not needed when minify is disabled.
    // Also transforming multiple times with keepNames enabled breaks
    // tree-shaking. (#9164)
    keepNames: false,
  }

  initTSConfck(config.root)

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
  initTSConfck(config.root)

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
        // We use a regex to inject the helpers inside the wrappers.
        // We don't need to create a MagicString here because both the helpers and
        // the headers don't modify the sourcemap
        const injectHelpers =
          opts.format === 'umd'
            ? INJECT_HELPERS_UMD_RE
            : opts.format === 'iife'
            ? INJECT_HELPERS_IIFE_RE
            : undefined
        if (injectHelpers) {
          res.code = res.code.replace(
            injectHelpers,
            (_, helpers, header) => header + helpers,
          )
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

let tsconfckRoot: string | undefined
let tsconfckParseOptions: TSConfckParseOptions | Promise<TSConfckParseOptions> =
  { resolveWithEmptyIfConfigNotFound: true }

function initTSConfck(root: string, force = false) {
  // bail if already cached
  if (!force && root === tsconfckRoot) return

  const workspaceRoot = searchForWorkspaceRoot(root)

  tsconfckRoot = root
  tsconfckParseOptions = initTSConfckParseOptions(workspaceRoot)

  // cached as the options value itself when promise is resolved
  tsconfckParseOptions.then((options) => {
    if (root === tsconfckRoot) {
      tsconfckParseOptions = options
    }
  })
}

async function initTSConfckParseOptions(workspaceRoot: string) {
  const start = debug ? performance.now() : 0

  const options: TSConfckParseOptions = {
    cache: new Map(),
    root: workspaceRoot,
    tsConfigPaths: new Set(
      await findAll(workspaceRoot, {
        skip: (dir) => dir === 'node_modules' || dir === '.git',
      }),
    ),
    resolveWithEmptyIfConfigNotFound: true,
  }

  debug?.(timeFrom(start), 'tsconfck init', colors.dim(workspaceRoot))

  return options
}

async function loadTsconfigJsonForFile(
  filename: string,
): Promise<TSConfigJSON> {
  try {
    const result = await parse(filename, await tsconfckParseOptions)
    // tsconfig could be out of root, make sure it is watched on dev
    if (server && result.tsconfigFile !== 'no_tsconfig_file_found') {
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
      (await tsconfckParseOptions)?.cache?.has(changedFile))
  ) {
    server.config.logger.info(
      `changed tsconfig file detected: ${changedFile} - Clearing cache and forcing full-reload to ensure TypeScript is compiled with updated config values.`,
      { clear: server.config.clearScreen, timestamp: true },
    )

    // clear module graph to remove code compiled with outdated config
    server.moduleGraph.invalidateAll()

    // reset tsconfck so that recompile works with up2date configs
    initTSConfck(server.config.root, true)

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
