import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { ServerPlugin } from '.'
import { defaultDefines } from '../config'

export const clientFilePath = path.resolve(__dirname, '../../client/client.js')

export const clientPublicPath = `/vite/client`

const legacyPublicPath = '/vite/hmr'

export const clientPlugin: ServerPlugin = ({ app, config }) => {
  const clientCode = fs
    .readFileSync(clientFilePath, 'utf-8')
    .replace(`__MODE__`, JSON.stringify(config.mode || 'development'))
    .replace(
      `__DEFINES__`,
      JSON.stringify({
        ...defaultDefines,
        ...config.define
      })
    )

  app.use(async (ctx, next) => {
    if (ctx.path === clientPublicPath) {
      let socketPort: number | string = ctx.port
      // infer on client by default
      let socketProtocol = null
      let socketHostname = null
      let socketTimeout = 30000
      if (config.hmr && typeof config.hmr === 'object') {
        // hmr option has highest priory
        socketProtocol = config.hmr.protocol || null
        socketHostname = config.hmr.hostname || null
        socketPort = config.hmr.port || ctx.port
        if (config.hmr.timeout) {
          socketTimeout = config.hmr.timeout
        }
        if (config.hmr.path) {
          socketPort = `${socketPort}/${config.hmr.path}`
        }
      }
      ctx.type = 'js'
      ctx.status = 200
      ctx.body = clientCode
        .replace(`__HMR_PROTOCOL__`, JSON.stringify(socketProtocol))
        .replace(`__HMR_HOSTNAME__`, JSON.stringify(socketHostname))
        .replace(`__HMR_PORT__`, JSON.stringify(socketPort))
        .replace(`__HMR_TIMEOUT__`, JSON.stringify(socketTimeout))
    } else {
      if (ctx.path === legacyPublicPath) {
        console.error(
          chalk.red(
            `[vite] client import path has changed from "/vite/hmr" to "/vite/client". ` +
              `please update your code accordingly.`
          )
        )
      }
      return next()
    }
  })
}
