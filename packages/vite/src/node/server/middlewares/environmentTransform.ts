import type { Connect } from 'dep-types/connect'
import type { ViteDevServer } from '..'
import {
  ENVIRONMENT_URL_PUBLIC_PATH,
  NULL_BYTE_PLACEHOLDER,
} from '../../../shared/constants'

export function environmentTransformMiddleware(
  server: ViteDevServer,
): Connect.NextHandleFunction {
  return async function viteEnvironmentTransformMiddleware(req, res, next) {
    if (req.method !== 'GET') {
      return next()
    }

    let url: string
    try {
      url = decodeURI(req.url!).replace(NULL_BYTE_PLACEHOLDER, '\0')
    } catch (e) {
      return next(e)
    }

    if (!url.startsWith(ENVIRONMENT_URL_PUBLIC_PATH)) {
      return next()
    }

    const { pathname, searchParams } = new URL(url, 'http://localhost')
    const environmentName = pathname.slice(
      ENVIRONMENT_URL_PUBLIC_PATH.length + 1,
    )
    const environment = server.environments[environmentName]

    if (!environmentName || !environment) {
      res.statusCode = 404
      res.end()
      return
    }

    const moduleUrl = searchParams.get('moduleUrl')

    if (!moduleUrl) {
      res.statusCode = 404
      res.end()
      return
    }

    // TODO: how to check consistently for all environments(?)
    // currently ignores if the consumer is a `server`
    // https://github.com/vitejs/vite/blob/main/packages/vite/src/node/server/transformRequest.ts:271
    // if (!ensureServingAccess(moduleUrl, server, res, next)) {
    //   return
    // }

    try {
      const importer = searchParams.get('importer') || ''
      const cached = req.headers['x-vite-cache'] === 'true'
      const startOffset = req.headers['x-vite-start-offset']
        ? Number(req.headers['x-vite-start-offset'])
        : undefined
      const moduleResult = await environment.fetchModule(moduleUrl, importer, {
        cached,
        startOffset,
      })

      if (res.writableEnded) {
        return
      }

      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 200
      res.end(JSON.stringify(moduleResult))
      return
    } catch (e) {
      return next(e)
    }
  }
}
