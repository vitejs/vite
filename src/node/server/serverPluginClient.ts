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
      // #1142 infer hmr config form client location by default
      // The `ctx.port` is not equal to `location.port` when use docker
      if (config.hmr && typeof config.hmr === 'object') {
        ctx.body = clientCode
          .replace(`__HMR_PROTOCOL__`, JSON.stringify(config.hmr.protocol))
          .replace(`__HMR_HOSTNAME__`, JSON.stringify(config.hmr.hostname))
          .replace(`__HMR_PORT__`, JSON.stringify(config.hmr.port))
          .replace(`__HMR_PATH__`, JSON.stringify(config.hmr.path))
      }
      ctx.type = 'js'
      ctx.status = 200
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
