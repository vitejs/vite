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
import type { TSConfckParseOptions, TSConfckParseResult } from 'tsconfck'
import { TSConfckParseError, findAll, parse } from 'tsconfck'
import {
  cleanUrl,
  combineSourcemaps,
  createDebugger,
  createFilter,
  ensureWatchedFile,
  generateCodeFrame,
  toUpperCaseDriveLetter,
} from '../utils'
import type { ResolvedConfig, ViteDevServer } from '..'
import type { Plugin } from '../plugin'
import { searchForWorkspaceRoot } from '..'

const debug = createDebugger('vite:esbuild')

const INJECT_HELPERS_IIFE_RE =
  /^(.*?)((?:const|var) \S+=function\([^)]*\)\{"use strict";)/s
const INJECT_HELPERS_UMD_RE =
  /^(.*?)(\(function\([^)]*\)\{.+amd.+function\([^)]*\)\{"use strict";)/s

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
      .extname(/\.\w+$/.test(filename) ? filename : cleanUrl(filename))
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
          // @ts-ignore TypeScript can't tell they are of the same type
          compilerOptionsForFile[field] = loadedCompilerOptions[field]
        }
      }
    }

    tsconfigRaw = {
      ...tsconfigRaw,
      compilerOptions: {
        ...compilerOptionsForFile,
        ...tsconfigRaw?.compilerOptions,
      },
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

  // esbuild uses tsconfig fields when both the normal options and tsconfig was set
  // but we want to prioritize the normal options
  if (
    options &&
    typeof resolvedOptions.tsconfigRaw === 'object' &&
    resolvedOptions.tsconfigRaw.compilerOptions
  ) {
    options.jsx && (resolvedOptions.tsconfigRaw.compilerOptions.jsx = undefined)
    options.jsxFactory &&
      (resolvedOptions.tsconfigRaw.compilerOptions.jsxFactory = undefined)
    options.jsxFragment &&
      (resolvedOptions.tsconfigRaw.compilerOptions.jsxFragmentFactory =
        undefined)
    options.jsxImportSource &&
      (resolvedOptions.tsconfigRaw.compilerOptions.jsxImportSource = undefined)
    options.target &&
      (resolvedOptions.tsconfigRaw.compilerOptions.target = undefined)
  }

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
    if (Array.isArray(map.sources)) {
      map.sources = map.sources.map((it) => toUpperCaseDriveLetter(it))
    }
    return {
      ...result,
      map,
    }
  } catch (e: any) {
    debug(`esbuild error with options used: `, resolvedOptions)
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

export function esbuildPlugin(options: ESBuildOptions = {}): Plugin {
  const filter = createFilter(
    options.include || /\.(m?ts|[jt]sx)$/,
    options.exclude || /\.js$/,
  )

  // Remove optimization options for dev as we only need to transpile them,
  // and for build as the final optimization is in `buildEsbuildPlugin`
  const transformOptions: TransformOptions = {
    target: 'esnext',
    charset: 'utf8',
    ...options,
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

  return {
    name: 'vite:esbuild',
    configureServer(_server) {
      server = _server
      server.watcher
        .on('add', reloadOnTsconfigChange)
        .on('change', reloadOnTsconfigChange)
        .on('unlink', reloadOnTsconfigChange)
    },
    async configResolved(config) {
      await initTSConfck(config)
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
        if (options.jsxInject && /\.(?:j|t)sx\b/.test(id)) {
          result.code = options.jsxInject + ';' + result.code
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
    async configResolved(config) {
      await initTSConfck(config)
    },
    async renderChunk(code, chunk, opts) {
      // @ts-ignore injected by @vitejs/plugin-legacy
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

const tsconfckParseOptions: TSConfckParseOptions = {
  cache: new Map<string, TSConfckParseResult>(),
  tsConfigPaths: undefined,
  root: undefined,
  resolveWithEmptyIfConfigNotFound: true,
}

async function initTSConfck(config: ResolvedConfig) {
  const workspaceRoot = searchForWorkspaceRoot(config.root)
  debug(`init tsconfck (root: ${colors.cyan(workspaceRoot)})`)

  tsconfckParseOptions.cache!.clear()
  tsconfckParseOptions.root = workspaceRoot
  tsconfckParseOptions.tsConfigPaths = new Set([
    ...(await findAll(workspaceRoot, {
      skip: (dir) => dir === 'node_modules' || dir === '.git',
    })),
  ])
  debug(`init tsconfck end`)
}

async function loadTsconfigJsonForFile(
  filename: string,
): Promise<TSConfigJSON> {
  try {
    const result = await parse(filename, tsconfckParseOptions)
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

function reloadOnTsconfigChange(changedFile: string) {
  // any tsconfig.json that's added in the workspace could be closer to a code file than a previously cached one
  // any json file in the tsconfig cache could have been used to compile ts
  if (
    path.basename(changedFile) === 'tsconfig.json' ||
    (changedFile.endsWith('.json') &&
      tsconfckParseOptions?.cache?.has(changedFile))
  ) {
    server.config.logger.info(
      `changed tsconfig file detected: ${changedFile} - Clearing cache and forcing full-reload to ensure TypeScript is compiled with updated config values.`,
      { clear: server.config.clearScreen, timestamp: true },
    )

    // clear module graph to remove code compiled with outdated config
    server.moduleGraph.invalidateAll()

    // reset tsconfck so that recompile works with up2date configs
    initTSConfck(server.config).finally(() => {
      // server may not be available if vite config is updated at the same time
      if (server) {
        // force full reload
        server.ws.send({
          type: 'full-reload',
          path: '*',
        })
      }
    })
  }
}
