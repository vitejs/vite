import path from 'node:path'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { CLIENT_ENTRY, ENV_ENTRY } from '../constants'
import {
  isObject,
  normalizePath,
  replaceInCode,
  resolveHostname
} from '../utils'

// ids in transform are normalized to unix style
const normalizedClientEntry = normalizePath(CLIENT_ENTRY)
const normalizedEnvEntry = normalizePath(ENV_ENTRY)

/**
 * some values used by the client needs to be dynamically injected by the server
 * @server-only
 */
export function clientInjectionsPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:client-inject',
    async transform(code, id, options) {
      if (id === normalizedClientEntry || id === normalizedEnvEntry) {
        const resolvedServerHostname = (
          await resolveHostname(config.server.host)
        ).name
        const resolvedServerPort = config.server.port!
        const devBase = config.base

        const serverHost = `${resolvedServerHostname}:${resolvedServerPort}${devBase}`

        let hmrConfig = config.server.hmr
        hmrConfig = isObject(hmrConfig) ? hmrConfig : undefined
        const host = hmrConfig?.host || null
        const protocol = hmrConfig?.protocol || null
        const timeout = hmrConfig?.timeout || 30000
        const overlay = hmrConfig?.overlay !== false

        // hmr.clientPort -> hmr.port
        // -> (24678 if middleware mode) -> new URL(import.meta.url).port
        let port = hmrConfig?.clientPort || hmrConfig?.port || null
        if (config.server.middlewareMode) {
          port ||= 24678
        }

        let directTarget = hmrConfig?.host || resolvedServerHostname
        directTarget += `:${hmrConfig?.port || resolvedServerPort}`
        directTarget += devBase

        let hmrBase = devBase
        if (hmrConfig?.path) {
          hmrBase = path.posix.join(hmrBase, hmrConfig.path)
        }

        const replacements: Record<string, string> = {
          __MODE__: JSON.stringify(config.mode),
          __BASE__: JSON.stringify(devBase),
          __DEFINES__: serializeDefine(config.define || {}),
          __SERVER_HOST__: JSON.stringify(serverHost),
          __HMR_PROTOCOL__: JSON.stringify(protocol),
          __HMR_HOSTNAME__: JSON.stringify(host),
          __HMR_PORT__: JSON.stringify(port),
          __HMR_DIRECT_TARGET__: JSON.stringify(directTarget),
          __HMR_BASE__: JSON.stringify(hmrBase),
          __HMR_TIMEOUT__: JSON.stringify(timeout),
          __HMR_ENABLE_OVERLAY__: JSON.stringify(overlay)
        }
        const pattern = new RegExp(Object.keys(replacements).join('|'), 'gu')
        return replaceInCode(code, pattern, replacements)?.toString() ?? null
      } else if (!options?.ssr) {
        // replace process.env.NODE_ENV instead of defining a global
        // for it to avoid shimming a `process` object during dev,
        // avoiding inconsistencies between dev and build
        return (
          replaceInCode(
            code,
            /\bprocess\.env\.NODE_ENV\b/g,
            config.define?.['process.env.NODE_ENV'] ||
              JSON.stringify(process.env.NODE_ENV || config.mode)
          )?.toString() ?? null
        )
      }
      return null
    }
  }
}

function serializeDefine(define: Record<string, any>): string {
  let res = `{`
  for (const key in define) {
    const val = define[key]
    res += `${JSON.stringify(key)}: ${
      typeof val === 'string' ? `(${val})` : JSON.stringify(val)
    }, `
  }
  return res + `}`
}
