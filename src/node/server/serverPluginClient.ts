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
      let socketProtocol = null // infer on client by default
      let socketHost = ctx.host.toString()
      if (config.hmr && typeof config.hmr === 'object') {
        // hmr option has highest priory
        socketProtocol = config.hmr.protocol || null
        const hostname = config.hmr.hostname || ctx.hostname
        const port = config.hmr.port || ctx.port
        socketHost = `${hostname}:${port}`
        if (config.hmr.path) {
          socketHost += `/${config.hmr.path}`
        }
      }
      ctx.type = 'js'
      ctx.status = 200
      ctx.body = clientCode
        .replace(`__HMR_PROTOCOL__`, JSON.stringify(socketProtocol))
        .replace(`__HMR_HOST__`, JSON.stringify(socketHost))
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
