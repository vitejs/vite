import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { Context, ServerPlugin, State } from '.'
import { defaultDefines } from '../config'
import Application from 'koa'

export const clientFilePath = path.resolve(__dirname, '../../client/client.js')

export const clientPublicPath = `/vite/client`

const legacyPublicPath = '/vite/hmr'

function updatePort(
  clientCode: string,
  ctx: Application.ParameterizedContext<State, Context>
) {
  // If the end-user is running the CLI within a GitHub Codespace,
  // then set the port to 0, which indicates that we should use
  // whichever port the client application is running on (e.g. 443).
  const port = !!process.env['CODESPACES'] ? 0 : ctx.port
  return clientCode.replace(`__PORT__`, port.toString())
}

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
      ctx.type = 'js'
      ctx.status = 200
      ctx.body = updatePort(clientCode, ctx)
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
