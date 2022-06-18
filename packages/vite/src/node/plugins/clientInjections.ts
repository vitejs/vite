import path from 'path'
import type { Plugin } from '../plugin'
import type { ResolvedConfig } from '../config'
import { CLIENT_ENTRY, ENV_ENTRY } from '../constants'
import { isObject, normalizePath } from '../utils'

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
    transform(code, id, options) {
      if (id === normalizedClientEntry || id === normalizedEnvEntry) {
        let options = config.server.hmr
        options = options && typeof options !== 'boolean' ? options : {}
        const host = options.host || null
        const protocol = options.protocol || null
        const timeout = options.timeout || 30000
        const overlay = options.overlay !== false

        // hmr.clientPort -> hmr.port
        // -> (24678 if middleware mode) -> new URL(import.meta.url).port
        let port: string | null = null
        if (isObject(config.server.hmr)) {
          port = String(config.server.hmr.clientPort || config.server.hmr.port)
        }
        if (config.server.middlewareMode) {
          port ||= '24678'
        }

        let hmrBase = config.base
        if (options.path) {
          hmrBase = path.posix.join(hmrBase, options.path)
        }

        return code
          .replace(`__MODE__`, JSON.stringify(config.mode))
          .replace(`__BASE__`, JSON.stringify(config.base))
          .replace(`__DEFINES__`, serializeDefine(config.define || {}))
          .replace(`__HMR_PROTOCOL__`, JSON.stringify(protocol))
          .replace(`__HMR_HOSTNAME__`, JSON.stringify(host))
          .replace(`__HMR_PORT__`, JSON.stringify(port))
          .replace(`__HMR_BASE__`, JSON.stringify(hmrBase))
          .replace(`__HMR_TIMEOUT__`, JSON.stringify(timeout))
          .replace(`__HMR_ENABLE_OVERLAY__`, JSON.stringify(overlay))
      } else if (!options?.ssr && code.includes('process.env.NODE_ENV')) {
        // replace process.env.NODE_ENV instead of defining a global
        // for it to avoid shimming a `process` object during dev,
        // avoiding inconsistencies between dev and build
        return code.replace(
          /\bprocess\.env\.NODE_ENV\b/g,
          config.define?.['process.env.NODE_ENV'] ||
            JSON.stringify(process.env.NODE_ENV || config.mode)
        )
      }
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
