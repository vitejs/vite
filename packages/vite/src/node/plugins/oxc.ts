import path from 'node:path'
import colors from 'picocolors'
import type { RawSourceMap } from '@jridgewell/remapping'
import type { SourceMap } from 'rollup'
import type { TSConfckParseResult } from 'tsconfck'
import type { FSWatcher } from 'dep-types/chokidar'
import {
  combineSourcemaps,
  createDebugger,
  createFilter,
  generateCodeFrame,
} from '../utils'
import type { ViteDevServer } from '../server'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { cleanUrl } from '../../shared/utils'
import { loadTsconfigJsonForFile } from './esbuild'

const debug = createDebugger('vite:oxc')

const validExtensionRE = /\.\w+$/
const jsxExtensionsRE = /\.(?:j|t)sx\b/

// Basic Oxc transform options based on @oxc-project/types and common use cases
export interface OxcTransformOptions {
  /** Language target */
  target?: 'es5' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext'
  /** JSX transformation */
  jsx?: {
    /** JSX runtime - 'automatic' | 'classic' */
    runtime?: 'automatic' | 'classic'
    /** Import source for JSX */
    importSource?: string
    /** JSX pragma for classic runtime */
    pragma?: string
    /** JSX fragment pragma for classic runtime */
    pragmaFrag?: string
    /** Development mode */
    development?: boolean
  }
  /** Enable TypeScript transformation */
  typescript?: boolean
  /** Enable sourcemap generation */
  sourcemap?: boolean
  /** Minification options */
  minify?: boolean
  /** Decorator support */
  decorators?: boolean
  /** Enable syntax lowering */
  syntaxLowering?: boolean
}

export interface OxcOptions extends OxcTransformOptions {
  include?: string | RegExp | ReadonlyArray<string | RegExp>
  exclude?: string | RegExp | ReadonlyArray<string | RegExp>
  /** Additional JSX helpers injection */
  jsxInject?: string
}

export interface OxcTransformResult {
  code: string
  map: SourceMap
}

/**
 * Transform code using Oxc
 * This is a simplified implementation that mimics esbuild's transform API
 * In a real implementation, this would use the actual Oxc transformer
 */
export async function transformWithOxc(
  code: string,
  filename: string,
  options?: OxcTransformOptions,
  inMap?: object,
  config?: ResolvedConfig,
  watcher?: FSWatcher,
): Promise<OxcTransformResult> {
  // For now, this is a placeholder implementation
  // In a real implementation, this would call the Oxc transformer
  
  let loader = getLoaderFromFilename(filename)
  
  // Load TypeScript configuration if needed
  let tsConfig
  if ((loader === 'ts' || loader === 'tsx') && config) {
    try {
      const { tsconfig } = await loadTsconfigJsonForFile(filename, config)
      tsConfig = tsconfig
    } catch (e) {
      debug?.(`Failed to load tsconfig for ${filename}:`, e)
    }
  }

  const resolvedOptions: OxcTransformOptions = {
    sourcemap: true,
    typescript: loader === 'ts' || loader === 'tsx',
    ...options,
  }

  try {
    // Placeholder transformation - in reality this would use Oxc
    // For now, just return the original code with a simple transform
    const transformedCode = await simulateOxcTransform(code, filename, resolvedOptions, tsConfig)
    
    let map: SourceMap
    if (inMap && resolvedOptions.sourcemap) {
      // In a real implementation, combine source maps from Oxc
      map = inMap as SourceMap
    } else {
      map = resolvedOptions.sourcemap 
        ? generateSimpleSourceMap(filename, code, transformedCode)
        : { mappings: '' }
    }

    return {
      code: transformedCode,
      map,
    }
  } catch (e: any) {
    debug?.(`oxc error with options used: `, resolvedOptions)
    // Create a user-friendly error message
    e.frame = generateCodeFrame(code, { line: 1, column: 1 })
    throw e
  }
}

function getLoaderFromFilename(filename: string): string {
  const ext = path
    .extname(validExtensionRE.test(filename) ? filename : cleanUrl(filename))
    .slice(1)

  if (ext === 'cjs' || ext === 'mjs') {
    return 'js'
  } else if (ext === 'cts' || ext === 'mts') {
    return 'ts'
  } else {
    return ext
  }
}

/**
 * Simulate Oxc transformation - this is a placeholder
 * In a real implementation, this would use the actual Oxc transformer
 */
async function simulateOxcTransform(
  code: string,
  filename: string,
  options: OxcTransformOptions,
  tsConfig?: any,
): Promise<string> {
  let transformedCode = code

  // Basic JSX transformation simulation
  if (options.jsx && jsxExtensionsRE.test(filename)) {
    if (options.jsx.runtime === 'automatic') {
      // Transform JSX with automatic runtime
      transformedCode = transformedCode.replace(
        /import\s+React\s+from\s+['"]react['"];?\s*/g,
        ''
      )
    }
  }

  // Basic TypeScript transformation simulation
  if (options.typescript) {
    // Remove type annotations (very basic simulation)
    transformedCode = transformedCode
      .replace(/:\s*\w+(\[\])?/g, '') // Remove type annotations
      .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remove interfaces
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type aliases
  }

  return transformedCode
}

function generateSimpleSourceMap(filename: string, originalCode: string, transformedCode: string): SourceMap {
  // Generate a simple source map - in reality Oxc would provide this
  return {
    version: 3,
    sources: [filename],
    sourcesContent: [originalCode],
    names: [],
    mappings: 'AAAA', // Very basic mapping
  } as SourceMap
}

export function oxcPlugin(config: ResolvedConfig): Plugin {
  const options = config.oxc as OxcOptions
  if (!options) {
    return {
      name: 'vite:oxc',
    }
  }

  const { jsxInject, include, exclude, ...oxcTransformOptions } = options

  const filter = createFilter(include || /\.(m?ts|[jt]sx)$/, exclude || /\.js$/)

  // Remove optimization options for dev as we only need to transpile them
  const transformOptions: OxcTransformOptions = {
    ...oxcTransformOptions,
    minify: false, // Don't minify in dev
  }

  return {
    name: 'vite:oxc',
    async transform(code, id) {
      if (filter(id) || filter(cleanUrl(id))) {
        const result = await transformWithOxc(
          code,
          id,
          transformOptions,
          undefined,
          config,
          this.addWatchFile ? (file: string) => this.addWatchFile!(file) : undefined,
        )

        if (jsxInject && jsxExtensionsRE.test(id)) {
          result.code = jsxInject + ';' + result.code
        }

        return result
      }
    },
  }
}