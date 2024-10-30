import { transform } from 'esbuild'
import { TraceMap, decodedMap, encodedMap } from '@jridgewell/trace-mapping'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { escapeRegex } from '../utils'
import type { Environment } from '../environment'
import { isCSSRequest } from './css'
import { isHTMLRequest } from './html'

const nonJsRe = /\.json(?:$|\?)/
const isNonJsRequest = (request: string): boolean => nonJsRe.test(request)
const importMetaEnvMarker = '__vite_import_meta_env__'
const importMetaEnvKeyReCache = new Map<string, RegExp>()

export function definePlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  const isBuildLib = isBuild && config.build.lib

  // ignore replace process.env in lib build
  const processEnv: Record<string, string> = {}
  if (!isBuildLib) {
    const nodeEnv = process.env.NODE_ENV || config.mode
    Object.assign(processEnv, {
      'process.env': `{}`,
      'global.process.env': `{}`,
      'globalThis.process.env': `{}`,
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      'global.process.env.NODE_ENV': JSON.stringify(nodeEnv),
      'globalThis.process.env.NODE_ENV': JSON.stringify(nodeEnv),
    })
  }

  // during dev, import.meta properties are handled by importAnalysis plugin.
  const importMetaKeys: Record<string, string> = {}
  const importMetaEnvKeys: Record<string, string> = {}
  const importMetaFallbackKeys: Record<string, string> = {}
  if (isBuild) {
    importMetaKeys['import.meta.hot'] = `undefined`
    for (const key in config.env) {
      const val = JSON.stringify(config.env[key])
      importMetaKeys[`import.meta.env.${key}`] = val
      importMetaEnvKeys[key] = val
    }
    // these will be set to a proper value in `generatePattern`
    importMetaKeys['import.meta.env.SSR'] = `undefined`
    importMetaFallbackKeys['import.meta.env'] = `undefined`
  }

  function generatePattern(environment: Environment) {
    const userDefine: Record<string, string> = {}
    const userDefineEnv: Record<string, any> = {}
    for (const key in environment.config.define) {
      userDefine[key] = handleDefineValue(environment.config.define[key])

      // make sure `import.meta.env` object has user define properties
      if (isBuild && key.startsWith('import.meta.env.')) {
        userDefineEnv[key.slice(16)] = environment.config.define[key]
      }
    }

    const replaceProcessEnv = environment.config.webCompatible

    const define: Record<string, string> = {
      ...(replaceProcessEnv ? processEnv : {}),
      ...importMetaKeys,
      ...userDefine,
      ...importMetaFallbackKeys,
    }

    // Additional define fixes based on `ssr` value
    const ssr = environment.config.consumer === 'server'

    if ('import.meta.env.SSR' in define) {
      define['import.meta.env.SSR'] = ssr + ''
    }
    if ('import.meta.env' in define) {
      define['import.meta.env'] = importMetaEnvMarker
    }

    const importMetaEnvVal = serializeDefine({
      ...importMetaEnvKeys,
      SSR: ssr + '',
      ...userDefineEnv,
    })

    // Create regex pattern as a fast check before running esbuild
    const patternKeys = Object.keys(userDefine)
    if (replaceProcessEnv && Object.keys(processEnv).length) {
      patternKeys.push('process.env')
    }
    if (Object.keys(importMetaKeys).length) {
      patternKeys.push('import.meta.env', 'import.meta.hot')
    }
    const pattern = patternKeys.length
      ? new RegExp(patternKeys.map(escapeRegex).join('|'))
      : null

    return [define, pattern, importMetaEnvVal] as const
  }

  const patternsCache = new WeakMap<
    Environment,
    readonly [Record<string, string>, RegExp | null, string]
  >()
  function getPattern(environment: Environment) {
    let pattern = patternsCache.get(environment)
    if (!pattern) {
      pattern = generatePattern(environment)
      patternsCache.set(environment, pattern)
    }
    return pattern
  }

  return {
    name: 'vite:define',

    async transform(code, id) {
      if (this.environment.config.consumer === 'client' && !isBuild) {
        // for dev we inject actual global defines in the vite client to
        // avoid the transform cost. see the `clientInjection` and
        // `importAnalysis` plugin.
        return
      }

      if (
        // exclude html, css and static assets for performance
        isHTMLRequest(id) ||
        isCSSRequest(id) ||
        isNonJsRequest(id) ||
        config.assetsInclude(id)
      ) {
        return
      }

      let [define, pattern, importMetaEnvVal] = getPattern(this.environment)
      if (!pattern) return

      // Check if our code needs any replacements before running esbuild
      pattern.lastIndex = 0
      if (!pattern.test(code)) return

      const hasDefineImportMetaEnv = 'import.meta.env' in define
      let marker = importMetaEnvMarker

      if (hasDefineImportMetaEnv && code.includes(marker)) {
        // append a number to the marker until it's unique, to avoid if there is a
        // marker already in the code
        let i = 1
        do {
          marker = importMetaEnvMarker + i++
        } while (code.includes(marker))

        if (marker !== importMetaEnvMarker) {
          define = { ...define, 'import.meta.env': marker }
        }
      }

      const result = await replaceDefine(this.environment, code, id, define)

      if (hasDefineImportMetaEnv) {
        // Replace `import.meta.env.*` with undefined
        result.code = result.code.replaceAll(
          getImportMetaEnvKeyRe(marker),
          (m) => 'undefined'.padEnd(m.length),
        )

        // If there's bare `import.meta.env` references, prepend the banner
        if (result.code.includes(marker)) {
          result.code = `const ${marker} = ${importMetaEnvVal};\n` + result.code

          if (result.map) {
            const map = JSON.parse(result.map)
            map.mappings = ';' + map.mappings
            result.map = map
          }
        }
      }

      return result
    },
  }
}

export async function replaceDefine(
  environment: Environment,
  code: string,
  id: string,
  define: Record<string, string>,
): Promise<{ code: string; map: string | null }> {
  const esbuildOptions = environment.config.esbuild || {}

  const result = await transform(code, {
    loader: 'js',
    charset: esbuildOptions.charset ?? 'utf8',
    platform: 'neutral',
    define,
    sourcefile: id,
    sourcemap:
      environment.config.command === 'build'
        ? !!environment.config.build.sourcemap
        : true,
  })

  // remove esbuild's <define:...> source entries
  // since they would confuse source map remapping/collapsing which expects a single source
  if (result.map.includes('<define:')) {
    const originalMap = new TraceMap(result.map)
    if (originalMap.sources.length >= 2) {
      const sourceIndex = originalMap.sources.indexOf(id)
      const decoded = decodedMap(originalMap)
      decoded.sources = [id]
      decoded.mappings = decoded.mappings.map((segments) =>
        segments.filter((segment) => {
          // modify and filter
          const index = segment[1]
          segment[1] = 0
          return index === sourceIndex
        }),
      )
      result.map = JSON.stringify(encodedMap(new TraceMap(decoded as any)))
    }
  }

  return {
    code: result.code,
    map: result.map || null,
  }
}

/**
 * Like `JSON.stringify` but keeps raw string values as a literal
 * in the generated code. For example: `"window"` would refer to
 * the global `window` object directly.
 */
export function serializeDefine(define: Record<string, any>): string {
  let res = `{`
  const keys = Object.keys(define).sort()
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const val = define[key]
    res += `${JSON.stringify(key)}: ${handleDefineValue(val)}`
    if (i !== keys.length - 1) {
      res += `, `
    }
  }
  return res + `}`
}

function handleDefineValue(value: any): string {
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function getImportMetaEnvKeyRe(marker: string): RegExp {
  let re = importMetaEnvKeyReCache.get(marker)
  if (!re) {
    re = new RegExp(`${marker}\\..+?\\b`, 'g')
    importMetaEnvKeyReCache.set(marker, re)
  }
  return re
}
