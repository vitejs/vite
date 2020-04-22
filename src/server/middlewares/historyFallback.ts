import { Middleware } from '../index'

export const historyFallbackMiddleware: Middleware = ({ app }) => {
  app.use((ctx, next) => {
    const cleanUrl = ctx.url.split('?')[0].split('#')[0]
    if (ctx.method !== 'GET' || cleanUrl.includes('.')) {
      return next()
    }

    if (!ctx.headers || typeof ctx.headers.accept !== 'string') {
      return next()
    }

    if (ctx.headers.accept.includes('application/json')) {
      return next()
    }

    if (
      !(
        ctx.headers.accept.includes('text/html') ||
        ctx.headers.accept.includes('*/*')
      )
    ) {
      return next()
    }

    ctx.url = '/index.html'
    return next()
  })
}
