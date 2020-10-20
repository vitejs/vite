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
      const socketProtocol = ctx.protocol.toString() === 'https' ? 'wss' : 'ws'
      let socketUrl = `${socketProtocol}://${ctx.host.toString()}`
      if (config.hmr && typeof config.hmr === 'object') {
        // hmr option has highest priory
        const protocol = config.hmr.protocol || socketProtocol
        const hostname = config.hmr.hostname || ctx.hostname
        const port = config.hmr.port || ctx.port
        socketUrl = `${protocol}://${hostname}:${port}`
        if (config.hmr.path) {
          socketUrl = socketUrl + '/' + config.hmr.path
        }
      }
      ctx.type = 'js'
      ctx.status = 200
      ctx.body = clientCode.replace(`__HOST__`, JSON.stringify(socketUrl))
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
