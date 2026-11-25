import type { Connect } from '#dep-types/connect'
import type { ViteDevServer } from '..'
import type { BundledDevPayload } from '../bundledDev'
import { sendPayload } from './bundledDevPayload'

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

    const query = req.url.slice('/@vite/lazy?'.length)
    const moduleId = new URLSearchParams(query).get('id')
    if (!moduleId) {
      return next()
    }
    let payload: BundledDevPayload
    try {
      payload = await bundledDev.triggerLazyBundling(moduleId, query)
    } catch (e) {
      server.config.logger.error(
        `Failed to trigger lazy bundling for ${moduleId}:` + e,
        { error: e },
      )
      return next(new Error(`Failed to trigger lazy bundling`))
    }
    sendPayload(server, res, payload, bundledDev.lazyMaps)
  }
}
