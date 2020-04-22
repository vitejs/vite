import { Middleware } from '../index'

export const serveMiddleware: Middleware = ({ root, app }) => {
  app.use(require('koa-static')(root))
}
