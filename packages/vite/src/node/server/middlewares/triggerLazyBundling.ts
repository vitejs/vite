import path from 'node:path'
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
    const builtChunk = moduleId && (await bundledDev.builtLazyChunk(moduleId))
    if (builtChunk) {
      res.statusCode = 302
      res.setHeader('Location', path.posix.join(server.config.base, builtChunk))
      return res.end()
    }
    let result: { code: string; filename: string } | undefined
    try {
      result = await bundledDev.triggerLazyBundling(moduleId, clientId)
    } catch (e) {
      server.config.logger.error(
        `Failed to trigger lazy bundling for ${moduleId} (clientId: ${clientId}):` +
          e,
        { error: e },
      )
      return next(new Error(`Failed to trigger lazy bundling`))
    }
    if (result == null) {
      return next()
    }

    res!.setHeader('Content-Type', 'application/javascript')
    return res!.end(result.code)
  }
}
