import type { ViteDevServer } from '../../node/server'
import type { Plugin } from '../../node/plugin'
import { bareImportRE } from '../../node/utils'
import { tryOptimizedResolve } from './resolve'

/**
 * A plugin to avoid an aliased AND optimized dep from being aliased in src
 */
export function preAliasPlugin(): Plugin {
  let server: ViteDevServer
  return {
    name: 'vite:browser:pre-alias',
    configureServer(_server) {
      server = _server
    },
    resolveId(id, importer, _, ssr) {
      if (!ssr && bareImportRE.test(id)) {
        return tryOptimizedResolve(id, server, importer)
      }
    }
  }
}
