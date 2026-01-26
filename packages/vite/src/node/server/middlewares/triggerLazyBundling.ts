import type { Connect } from '#dep-types/connect'
import type { ViteDevServer } from '..'
import { FullBundleDevEnvironment } from '../environments/fullBundleEnvironment'

export function triggerLazyBundlingMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  const environment =
    server.environments.client instanceof FullBundleDevEnvironment
      ? server.environments.client
      : undefined
  if (!environment) {
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
    const code = await environment.triggerLazyBundling(moduleId, clientId)
    if (code == null) {
      return next()
    }

    res!.setHeader('Content-Type', 'application/javascript')
    return res!.end(code)
  }
}
