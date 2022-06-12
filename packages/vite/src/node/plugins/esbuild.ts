import path from 'path'
import colors from 'picocolors'
import type {
  Loader,
  Message,
  TransformOptions,
  TransformResult
} from 'esbuild'
import { transform } from 'esbuild'
import type { RawSourceMap } from '@ampproject/remapping'
import type { SourceMap } from 'rollup'
import { createFilter } from '@rollup/pluginutils'
import type { TSConfckParseOptions, TSConfckParseResult } from 'tsconfck'
import { TSConfckParseError, findAll, parse } from 'tsconfck'
import {
  cleanUrl,
  combineSourcemaps,
  createDebugger,
  ensureWatchedFile,
  generateCodeFrame,
  toUpperCaseDriveLetter
} from '../utils'
import type { ResolvedConfig, ViteDevServer } from '..'
import type { Plugin } from '../plugin'
import { searchForWorkspaceRoot } from '..'

const debug = createDebugger('vite:esbuild')

const INJECT_HELPERS_IIFE_RE =
  /(.*)((?:const|var) [^\s]+=function\([^)]*?\){"use strict";)(.*)/s
const INJECT_HELPERS_UMD_RE =
  /(.*)(\(function\([^)]*?\){.+amd.+function\([^)]*?\){"use strict";)(.*)/s

let server: ViteDevServer

export interface ESBuildOptions extends TransformOptions {
  include?: string | RegExp | string[] | RegExp[]
  exclude?: string | RegExp | string[] | RegExp[]
  jsxInject?: string
}

export type ESBuildTransformResult = Omit<TransformResult, 'map'> & {
  map: SourceMap
}

type TSConfigJSON = {
  extends?: string
  compilerOptions?: {
    target?: string
    jsxFactory?: string
    jsxFragmentFactory?: string
    useDefineForClassFields?: boolean
    importsNotUsedAsValues?: 'remove' | 'preserve' | 'error'
    preserveValueImports?: boolean
  }
  [key: string]: any
}
type TSCompilerOptions = NonNullable<TSConfigJSON['compilerOptions']>

export async function transformWithEsbuild(
  code: string,
  filename: string,
  options?: TransformOptions,
  inMap?: object
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
    } else {
      loader = ext as Loader
    }
  }

  let tsconfigRaw = options?.tsconfigRaw

  // if options provide tsconfigraw in string, it takes highest precedence
  if (typeof tsconfigRaw !== 'string') {
    // these fields would affect the compilation result
    // https://esbuild.github.io/content-types/#tsconfig-json
    const meaningfulFields: Array<keyof TSCompilerOptions> = [
      'target',
      'jsxFactory',
      'jsxFragmentFactory',
      'useDefineForClassFields',
      'importsNotUsedAsValues',
      'preserveValueImports'
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
        ...tsconfigRaw?.compilerOptions
      }
    }
  }

  const resolvedOptions = {
    sourcemap: true,
    // ensure source file name contains full query
    sourcefile: filename,
    ...options,
    loader,
    tsconfigRaw
  } as ESBuildOptions

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
        inMap as RawSourceMap
      ]) as SourceMap
    } else {
      map = resolvedOptions.sourcemap
        ? JSON.parse(result.map)
        : { mappings: '' }
    }
    if (Array.isArray(map.sources)) {
      map.sources = map.sources.map((it) => toUpperCaseDriveLetter(it))
    }
    return {
      ...result,
      map
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
    options.include || /\.(tsx?|jsx)$/,
    options.exclude || /\.js$/
  )

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
        const result = await transformWithEsbuild(code, id, options)
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
          map: result.map
        }
      }
    }
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
  iife: undefined
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

      const target = config.build.target
      const minify =
        config.build.minify === 'esbuild' &&
        // Do not minify ES lib output since that would remove pure annotations
        // and break tree-shaking
        // https://github.com/vuejs/core/issues/2860#issuecomment-926882793
        !(config.build.lib && opts.format === 'es')

      if ((!target || target === 'esnext') && !minify) {
        return null
      }

      const res = await transformWithEsbuild(code, chunk.fileName, {
        ...config.esbuild,
        target: target || undefined,
        ...(minify
          ? {
              minify,
              treeShaking: true,
              format: rollupToEsbuildFormatMap[opts.format]
            }
          : undefined)
      })

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
            (_, helpers, header, rest) => header + helpers + rest
          )
        }
      }
      return res
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
  resolveWithEmptyIfConfigNotFound: true
}

async function initTSConfck(config: ResolvedConfig) {
  tsconfckParseOptions.cache!.clear()
  const workspaceRoot = searchForWorkspaceRoot(config.root)
  tsconfckParseOptions.root = workspaceRoot
  tsconfckParseOptions.tsConfigPaths = new Set([
    ...(await findAll(workspaceRoot, {
      skip: (dir) => dir === 'node_modules' || dir === '.git'
    }))
  ])
}

async function loadTsconfigJsonForFile(
  filename: string
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
      `changed tsconfig file detected: ${changedFile} - Clearing cache and forcing full-reload to ensure typescript is compiled with updated config values.`,
      { clear: server.config.clearScreen, timestamp: true }
    )

    // clear module graph to remove code compiled with outdated config
    server.moduleGraph.invalidateAll()

    // reset tsconfck so that recompile works with up2date configs
    initTSConfck(server.config).finally(() => {
      // force full reload
      server.ws.send({
        type: 'full-reload',
        path: '*'
      })
    })
  }
}
