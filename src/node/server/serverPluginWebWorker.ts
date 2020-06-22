import { ServerPlugin } from '.'

export const webWrokerPlugin: ServerPlugin = ({ app }) => {
  app.use((ctx, next) => {
    if (ctx.query.worker != null) {
      ctx.type = 'js'
      ctx.body = `export default function WrappedWorker() {
        return new Worker(${JSON.stringify(ctx.path)}, { type: 'module' })
      }`
      return
    }
    return next()
  })
}
