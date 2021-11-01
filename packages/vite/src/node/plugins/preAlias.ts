import { ViteDevServer } from '..'
import { Plugin } from '../plugin'
import { bareImportRE, normalizePath } from '../utils'
import { tryOptimizedResolve } from './resolve'

/**
 * A plugin to avoid an aliased AND optimized dep from being aliased in src
 */
export function preAliasPlugin(): Plugin {
  let server: ViteDevServer
  return {
    name: 'vite:pre-alias',
    configureServer(_server) {
      server = _server
    },
    resolveId(id, importer, options) {
      // When using absolute path to import dep instead of bare import, the dep properly has pre-bundled. #5494
      if (
        !options?.ssr &&
        (bareImportRE.test(id) || server._optimizeDepsMetadata?.optimized[normalizePath(id)])
      ) {
        return tryOptimizedResolve(id, server, importer)
      }
    }
  }
}
