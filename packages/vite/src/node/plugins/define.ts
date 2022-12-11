import MagicString from 'magic-string'
import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'
import { transformStableResult } from '../utils'
import { isCSSRequest } from './css'
import { isHTMLRequest } from './html'

const nonJsRe = /\.json(?:$|\?)/
const isNonJsRequest = (request: string): boolean => nonJsRe.test(request)

export function definePlugin(config: ResolvedConfig): Plugin {
  const isBuild = config.command === 'build'
  const isBuildLib = isBuild && config.build.lib

  // ignore replace process.env in lib build
  const processEnv: Record<string, string> = {}
  const processNodeEnv: Record<string, string> = {}
  if (!isBuildLib) {
    const nodeEnv = process.env.NODE_ENV || config.mode
    Object.assign(processEnv, {
      'process.env.': `({}).`,
      'global.process.env.': `({}).`,
      'globalThis.process.env.': `({}).`,
    })
    Object.assign(processNodeEnv, {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      'global.process.env.NODE_ENV': JSON.stringify(nodeEnv),
      'globalThis.process.env.NODE_ENV': JSON.stringify(nodeEnv),
      __vite_process_env_NODE_ENV: JSON.stringify(nodeEnv),
    })
  }

  const userDefine: Record<string, string> = {}
  for (const key in config.define) {
    const val = config.define[key]
    userDefine[key] = typeof val === 'string' ? val : JSON.stringify(val)
  }

  // during dev, import.meta properties are handled by importAnalysis plugin.
  // ignore replace import.meta.env in lib build
  const importMetaKeys: Record<string, string> = {}
  const importMetaFallbackKeys: Record<string, string> = {}
  if (isBuild) {
    const env: Record<string, any> = {
      ...config.env,
      SSR: !!config.build.ssr,
    }
    for (const key in env) {
      importMetaKeys[`import.meta.env.${key}`] = JSON.stringify(env[key])
    }
    Object.assign(importMetaFallbackKeys, {
      'import.meta.env.': `({}).`,
      'import.meta.env': JSON.stringify(config.env),
      'import.meta.hot': `false`,
    })
  }

  function generatePattern(
    ssr: boolean,
  ): [Record<string, string | undefined>, RegExp | null] {
    const replaceProcessEnv = !ssr || config.ssr?.target === 'webworker'

    const replacements: Record<string, string> = {
      ...(replaceProcessEnv ? processNodeEnv : {}),
      ...importMetaKeys,
      ...userDefine,
      ...importMetaFallbackKeys,
      ...(replaceProcessEnv ? processEnv : {}),
    }

    if (isBuild && !replaceProcessEnv) {
      replacements['__vite_process_env_NODE_ENV'] = 'process.env.NODE_ENV'
    }

    const replacementsKeys = Object.keys(replacements)
    const pattern = replacementsKeys.length
      ? new RegExp(
          // Mustn't be preceded by a char that can be part of an identifier
          // or a '.' that isn't part of a spread operator
          '(?<![\\p{L}\\p{N}_$]|(?<!\\.\\.)\\.)(' +
            replacementsKeys
              .map((str) => {
                return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
              })
              .join('|') +
            // Mustn't be followed by a char that can be part of an identifier
            // or an assignment (but allow equality operators)
            ')(?:(?<=\\.)|(?![\\p{L}\\p{N}_$]|\\s*?=[^=]))',
          'gu',
        )
      : null

    return [replacements, pattern]
  }

  const defaultPattern = generatePattern(false)
  const ssrPattern = generatePattern(true)

  return {
    name: 'vite:define',

    transform(code, id, options) {
      const ssr = options?.ssr === true
      if (!ssr && !isBuild) {
        // for dev we inject actual global defines in the vite client to
        // avoid the transform cost.
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

      const [replacements, pattern] = ssr ? ssrPattern : defaultPattern

      if (!pattern) {
        return null
      }

      if (ssr && !isBuild) {
        // ssr + dev, simple replace
        return code.replace(pattern, (_, match) => {
          return '' + replacements[match]
        })
      }

      const s = new MagicString(code)
      let hasReplaced = false
      let match: RegExpExecArray | null

      while ((match = pattern.exec(code))) {
        hasReplaced = true
        const start = match.index
        const end = start + match[0].length
        const replacement = '' + replacements[match[1]]
        s.update(start, end, replacement)
      }

      if (!hasReplaced) {
        return null
      }

      return transformStableResult(s, id, config)
    },
  }
}
