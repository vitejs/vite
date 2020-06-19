import { ServerPlugin } from '.'

export const envPublicPath = '/vite/env'

export const envPlugin: ServerPlugin = ({ app, config }) => {
  const mode = config.mode || 'development'
  const env = JSON.stringify({
    ...config.env,
    BASE_URL: '/',
    MODE: mode,
    DEV: mode === 'development',
    PROD: mode === 'production'
  })

  app.use((ctx, next) => {
    if (ctx.path === envPublicPath) {
      ctx.type = 'js'
      ctx.body = `export default ${env}`
      return
    }
    return next()
  })
}
