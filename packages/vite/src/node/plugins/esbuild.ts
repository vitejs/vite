import path from 'path'
import chalk from 'chalk'
import { Plugin } from '../plugin'
import {
  transform,
  Message,
  Loader,
  TransformOptions,
  TransformResult
} from 'esbuild'
import {
  cleanUrl,
  createDebugger,
  ensureWatchedFile,
  generateCodeFrame,
  toUpperCaseDriveLetter
} from '../utils'
import { RawSourceMap } from '@ampproject/remapping/dist/types/types'
import { SourceMap } from 'rollup'
import { ResolvedConfig, ViteDevServer } from '..'
import { createFilter } from '@rollup/pluginutils'
import { combineSourcemaps } from '../utils'
import { parse, TSConfckParseError, TSConfckParseResult } from 'tsconfck'

const debug = createDebugger('vite:esbuild')

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
      'jsxFactory',
      'jsxFragmentFactory',
      'useDefineForClassFields',
      'importsNotUsedAsValues'
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

      // align with TypeScript 4.3
      // https://github.com/microsoft/TypeScript/pull/42663
      if (loadedCompilerOptions.target?.toLowerCase() === 'esnext') {
        compilerOptionsForFile.useDefineForClassFields =
          loadedCompilerOptions.useDefineForClassFields ?? true
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
  iife: 'iife'
}

export const buildEsbuildPlugin = (config: ResolvedConfig): Plugin => {
  return {
    name: 'vite:esbuild-transpile',
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
        // https://github.com/vuejs/vue-next/issues/2860#issuecomment-926882793
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
      return res
    }
  }
}

function prettifyMessage(m: Message, code: string): string {
  let res = chalk.yellow(m.text)
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

const tsconfigCache = new Map<string, TSConfckParseResult>()
async function loadTsconfigJsonForFile(
  filename: string
): Promise<TSConfigJSON> {
  try {
    const result = await parse(filename, {
      cache: tsconfigCache,
      resolveWithEmptyIfConfigNotFound: true
    })
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
    (changedFile.endsWith('.json') && tsconfigCache.has(changedFile))
  ) {
    server.config.logger.info(
      `changed tsconfig file detected: ${changedFile} - Clearing cache and forcing full-reload to ensure typescript is compiled with updated config values.`,
      { clear: server.config.clearScreen, timestamp: true }
    )
    // clear tsconfig cache so that recompile works with up2date configs
    tsconfigCache.clear()
    // clear module graph to remove code compiled with outdated config
    server.moduleGraph.invalidateAll()
    // force full reload
    server.ws.send({
      type: 'full-reload',
      path: '*'
    })
  }
}
