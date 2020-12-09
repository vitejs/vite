import fs from 'fs'
import getEtag from 'etag'
import { NextHandleFunction } from 'connect'
import { send } from '../send'
import { ServerContext } from '../..'
import { isObject } from '../../utils'

export const HMR_CLIENT_PATH = `/vite/client`

export interface HmrOptions {
  protocol?: string
  host?: string
  port?: number
  path?: string
  timeout?: number
}

export function hmrMiddleware({
  watcher,
  config
}: ServerContext): NextHandleFunction {
  watcher.on('change', () => {
    // handle change
  })

  const clientCode = fs
    // eslint-disable-next-line
    .readFileSync(require.resolve('vite/dist/client/client.js'), 'utf-8')
    .replace(`__MODE__`, JSON.stringify(config.mode || 'development'))
    .replace(
      `__DEFINES__`,
      JSON.stringify({}) // TODO
    )
  let resolvedClientCode: string | undefined
  let etag: string | undefined

  return (req, res, next) => {
    if (req.url! === HMR_CLIENT_PATH) {
      // we need to wait until the request coming in to resolve the final
      // host/port information in the client file
      if (!resolvedClientCode) {
        // set after server listen
        const hmrConfig = isObject(config.server.hmr) ? config.server.hmr : {}
        const host = hmrConfig.host || null
        const protocol = hmrConfig.protocol || null
        const timeout = hmrConfig.timeout || 30000
        let port = String(hmrConfig.port || config.server.port!)
        if (hmrConfig.path) {
          port = `${port}/${hmrConfig.path}`
        }
        resolvedClientCode = clientCode
          .replace(`__HMR_PROTOCOL__`, JSON.stringify(protocol))
          .replace(`__HMR_HOSTNAME__`, JSON.stringify(host))
          .replace(`__HMR_PORT__`, JSON.stringify(port))
          .replace(`__HMR_TIMEOUT__`, JSON.stringify(timeout))
        etag = getEtag(resolvedClientCode, { weak: true })
      }

      return send(req, res, resolvedClientCode, 'js', etag)
    }
    next()
  }
}
