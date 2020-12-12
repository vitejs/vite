import fs from 'fs'
import path from 'path'
import { ServerContext } from '../..'
import { tryFsResolve } from '../../plugins/resolve'
import { Connect } from 'types/connect'
import { send } from '../send'

export const CLIENT_PREFIX = `/@vite/`
export const CLIENT_PUBLIC_PATH = `${CLIENT_PREFIX}client`

// eslint-disable-next-line
const clientPath = require.resolve('vite/dist/client/client.js')
const clientDir = path.dirname(clientPath)

export function clientMiddleware({
  config
}: ServerContext): Connect.NextHandleFunction {
  // lazy resolve  the constant replacements because the port can only be
  // determined after the server is actually running.
  let resolvedCode: string | undefined

  return (req, res, next) => {
    if (!req.url?.startsWith(CLIENT_PREFIX)) {
      return next()
    }

    const fsPath = tryFsResolve(
      path.resolve(clientDir, req.url!.slice(CLIENT_PREFIX.length))
    )
    if (!fsPath) {
      return next(new Error(`Failed to resolve client file: ${req.url}`))
    }

    if (fsPath !== clientPath) {
      return send(req, res, fs.readFileSync(fsPath, 'utf-8'), 'js')
    }

    if (!resolvedCode) {
      // inject necessary server config
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

      debugger
      resolvedCode = fs
        .readFileSync(clientPath, 'utf-8')
        .replace(`__MODE__`, JSON.stringify(config.mode || 'development'))
        .replace(`__ROOT__`, JSON.stringify(config.root))
        .replace(
          `__DEFINES__`,
          JSON.stringify({}) // TODO
        )
        .replace(`__HMR_PROTOCOL__`, JSON.stringify(protocol))
        .replace(`__HMR_HOSTNAME__`, JSON.stringify(host))
        .replace(`__HMR_PORT__`, JSON.stringify(port))
        .replace(`__HMR_TIMEOUT__`, JSON.stringify(timeout))
        .replace(`__HMR_ENABLE_OVERLAY__`, JSON.stringify(overlay))
    }

    send(req, res, resolvedCode, 'js')
  }
}
