import type { Connect } from '#dep-types/connect'
import type { ViteDevServer } from '..'

export function triggerLazyBundlingMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  const bundledDev = server.environments.client.bundledDev
  if (!bundledDev) {
    throw new Error(
      'triggerLazyBundlingMiddleware can only be used for fullBundleMode',
    )
  }

  return async function viteTriggerLazyBundlingMiddleware(req, res, next) {
    if (!req.url?.startsWith('/@vite/lazy?')) {
      return next()
    }

    let params: URLSearchParams
    try {
      params = new URL(`http://localhost${req.url}`).searchParams
    } catch {
      // Malformed URL
      return next()
    }

    const moduleId = params.get('id')
    const clientId = params.get('clientId')
    const result = await bundledDev.triggerLazyBundling(moduleId, clientId)
    if (result == null) {
      return next()
    }

    res!.setHeader('Content-Type', 'application/javascript')
    res!.on('finish', () => bundledDev.markPayloadDelivered(result.filename))
    return res!.end(result.code)
  }
}
