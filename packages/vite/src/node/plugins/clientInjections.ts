import { Plugin } from '../plugin'
import { ResolvedConfig } from '../config'
import { CLIENT_ENTRY } from '../constants'

/**
 * some values used by the client needs to be dynamically injected by the server
 * @server-only
 */
export function clientInjectionsPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:client-inject',
    transform(code, id) {
      if (id === CLIENT_ENTRY) {
        let options = config.server.hmr
        options = options && typeof options !== 'boolean' ? options : {}
        const host = options.host || null
        const protocol = options.protocol || null
        const timeout = options.timeout || 30000
        const overlay = options.overlay !== false
        let port = String(options.port || config.server.port!)
        if (options.path) {
          port = `${port}/${options.path}`
        }

        return code
          .replace(`__MODE__`, JSON.stringify(config.mode || 'development'))
          .replace(`__ROOT__`, JSON.stringify(config.root))
          .replace(`__DEFINES__`, JSON.stringify(config.define || {}))
          .replace(`__HMR_PROTOCOL__`, JSON.stringify(protocol))
          .replace(`__HMR_HOSTNAME__`, JSON.stringify(host))
          .replace(`__HMR_PORT__`, JSON.stringify(port))
          .replace(`__HMR_TIMEOUT__`, JSON.stringify(timeout))
          .replace(`__HMR_ENABLE_OVERLAY__`, JSON.stringify(overlay))
      }
    }
  }
}
