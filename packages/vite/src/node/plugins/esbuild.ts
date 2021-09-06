import fs from 'fs'
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
import { cleanUrl, createDebugger, generateCodeFrame } from '../utils'
import { RawSourceMap } from '@ampproject/remapping/dist/types/types'
import { SourceMap } from 'rollup'
import { ResolvedConfig } from '..'
import { createFilter } from '@rollup/pluginutils'
import { combineSourcemaps } from '../utils'
import stripBom from 'strip-bom'
import stripComments from 'strip-json-comments'
import { createRequire } from 'module'

const debug = createDebugger('vite:esbuild')

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
  // if the id ends with a valid ext, use it (e.g. vue blocks)
  // otherwise, cleanup the query before checking the ext
  const ext = path.extname(
    /\.\w+$/.test(filename) ? filename : cleanUrl(filename)
  )

  let loader = ext.slice(1)
  if (loader === 'cjs' || loader === 'mjs') {
    loader = 'js'
  }

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

  const resolvedOptions = {
    loader: loader as Loader,
    sourcemap: true,
    // ensure source file name contains full query
    sourcefile: filename,
    tsconfigRaw: { compilerOptions: compilerOptionsForFile },
    ...options
  } as ESBuildOptions

  delete resolvedOptions.include
  delete resolvedOptions.exclude
  delete resolvedOptions.jsxInject

  try {
    const result = await transform(code, resolvedOptions)
    if (inMap) {
      const nextMap = JSON.parse(result.map)
      nextMap.sourcesContent = []
      return {
        ...result,
        map: combineSourcemaps(filename, [
          nextMap as RawSourceMap,
          inMap as RawSourceMap
        ]) as SourceMap
      }
    } else {
      return {
        ...result,
        map: JSON.parse(result.map)
      }
    }
  } catch (e) {
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

export const buildEsbuildPlugin = (config: ResolvedConfig): Plugin => {
  return {
    name: 'vite:esbuild-transpile',
    async renderChunk(code, chunk, opts) {
      // @ts-ignore injected by @vitejs/plugin-legacy
      if (opts.__vite_skip_esbuild__) {
        return null
      }

      const target = config.build.target
      const minify = config.build.minify === 'esbuild'
      if ((!target || target === 'esnext') && !minify) {
        return null
      }
      return transformWithEsbuild(code, chunk.fileName, {
        target: target || undefined,
        minify
      })
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

// modified from <https://github.com/TypeStrong/tsconfig/blob/v7.0.0/src/tsconfig.ts#L75-L95>

/**
 * Copyright (c) 2015 TypeStrong
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
async function findTSConfig(dir: string): Promise<string | void> {
  const configFile = path.resolve(dir, 'tsconfig.json')

  const stats = await stat(configFile)
  if (isFile(stats)) {
    return configFile
  }

  const parentDir = path.dirname(dir)

  if (dir === parentDir) {
    return
  }

  return findTSConfig(parentDir)
}

/**
 * Check if a file exists.
 */
function stat(filename: string): Promise<fs.Stats | void> {
  return new Promise((resolve, reject) => {
    fs.stat(filename, (err, stats) => {
      return err ? resolve() : resolve(stats)
    })
  })
}

/**
 * Check filesystem stat is a directory.
 */
function isFile(stats: fs.Stats | void) {
  return stats ? stats.isFile() || stats.isFIFO() : false
}

// from <https://github.com/TypeStrong/tsconfig/pull/31>
// by @dominikg

/**
 * replace dangling commas from pseudo-json string with single space
 *
 * limitations:
 * - pseudo-json must not contain comments, use strip-json-comments before
 * - only a single dangling comma before } or ] is removed
 *   stripDanglingComma('[1,2,]') === '[1,2 ]
 *   stripDanglingComma('[1,2,,]') === '[1,2, ]
 *
 * implementation heavily inspired by strip-json-comments
 */
function stripDanglingComma(jsonString: string) {
  /**
   * Check if char at qoutePosition is escaped by an odd number of backslashes preceding it
   */
  function isEscaped(jsonString: string, quotePosition: number) {
    let index = quotePosition - 1
    let backslashCount = 0

    while (jsonString[index] === '\\') {
      index -= 1
      backslashCount += 1
    }

    return backslashCount % 2 === 1
  }

  let insideString = false
  let offset = 0
  let result = ''
  let danglingCommaPos = null
  for (let i = 0; i < jsonString.length; i++) {
    const currentCharacter = jsonString[i]

    if (currentCharacter === '"') {
      const escaped = isEscaped(jsonString, i)
      if (!escaped) {
        insideString = !insideString
      }
    }

    if (insideString) {
      danglingCommaPos = null
      continue
    }
    if (currentCharacter === ',') {
      danglingCommaPos = i
      continue
    }
    if (danglingCommaPos) {
      if (currentCharacter === '}' || currentCharacter === ']') {
        result += jsonString.slice(offset, danglingCommaPos) + ' '
        offset = danglingCommaPos + 1
        danglingCommaPos = null
      } else if (!currentCharacter.match(/\s/)) {
        danglingCommaPos = null
      }
    }
  }

  return result + jsonString.substring(offset)
}

async function readTSConfig(configPath: string): Promise<TSConfigJSON> {
  const content: string = await new Promise((resolve, reject) => {
    fs.readFile(configPath, 'utf-8', (err, data) => {
      if (err) {
        reject(err)
        return
      }
      resolve(stripComments(stripBom(data)))
    })
  })

  // tsconfig.json can be empty
  if (/^\s*$/.test(content)) {
    return {}
  }

  return JSON.parse(stripDanglingComma(content)) as TSConfigJSON
}

const tsconfigCache = new Map<string, TSConfigJSON>()
async function loadTsconfigJsonForFile(
  filename: string
): Promise<TSConfigJSON> {
  const directory = path.dirname(filename)

  const cached = tsconfigCache.get(directory)
  if (cached) {
    return cached
  }

  let configPath = await findTSConfig(directory)
  let tsconfig: TSConfigJSON = {}

  if (configPath) {
    const visited = new Set()
    visited.add(configPath)

    tsconfig = await readTSConfig(configPath)
    while (tsconfig.extends) {
      const configRequire = createRequire(configPath)

      const extendsPath = configRequire.resolve(tsconfig.extends)
      const extendedConfig = await readTSConfig(extendsPath)

      if (visited.has(extendsPath)) {
        throw new Error(
          `Circular dependency detected in the "extends" field of ${configPath}`
        )
      }
      visited.add(extendsPath)

      tsconfig = {
        extends: extendedConfig.extends,
        compilerOptions: {
          ...extendedConfig.compilerOptions,
          ...tsconfig.compilerOptions
        }
      }
      configPath = extendsPath
    }
  }

  tsconfigCache.set(directory, tsconfig)
  return tsconfig
}
