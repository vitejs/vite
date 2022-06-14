import { createRequire } from 'module'
import MagicString from 'magic-string'
import type { ResolvedConfig } from '..'
import type { Plugin } from '../plugin'
import { arraify } from '../utils'

/**
 * This plugin hooks into Node's module resolution algorithm at runtime,
 * so that SSR builds can benefit from `resolve.dedupe` like they do
 * in development.
 */
export function ssrRequireHookPlugin(config: ResolvedConfig): Plugin | null {
  if (
    config.command !== 'build' ||
    !config.build.ssr ||
    !config.resolve.dedupe?.length ||
    config.ssr?.noExternal === true ||
    config.ssr?.format !== 'cjs' ||
    isBuildOutputEsm(config)
  ) {
    return null
  }
  return {
    name: 'vite:ssr-require-hook',
    transform(code, id) {
      const moduleInfo = this.getModuleInfo(id)
      if (moduleInfo?.isEntry) {
        const s = new MagicString(code)
        s.prepend(
          `;(${dedupeRequire.toString()})(${JSON.stringify(
            config.resolve.dedupe
          )});\n`
        )
        return {
          code: s.toString(),
          map: s.generateMap({
            source: id,
            hires: true
          })
        }
      }
    }
  }
}

type NodeResolveFilename = (
  request: string,
  parent: NodeModule,
  isMain: boolean,
  options?: Record<string, any>
) => string

/** Respect the `resolve.dedupe` option in production SSR. */
function dedupeRequire(dedupe: string[]) {
  // eslint-disable-next-line no-restricted-globals
  const Module = require('module') as { _resolveFilename: NodeResolveFilename }
  const resolveFilename = Module._resolveFilename
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (request[0] !== '.' && request[0] !== '/') {
      const parts = request.split('/')
      const pkgName = parts[0][0] === '@' ? parts[0] + '/' + parts[1] : parts[0]
      if (dedupe.includes(pkgName)) {
        // Use this module as the parent.
        parent = module
      }
    }
    return resolveFilename!(request, parent, isMain, options)
  }
}

const _require = createRequire(import.meta.url)
export function hookNodeResolve(
  getResolver: (resolveFilename: NodeResolveFilename) => NodeResolveFilename
): () => void {
  const Module = _require('module') as { _resolveFilename: NodeResolveFilename }
  const prevResolver = Module._resolveFilename
  Module._resolveFilename = getResolver(prevResolver)
  return () => {
    Module._resolveFilename = prevResolver
  }
}

function isBuildOutputEsm(config: ResolvedConfig) {
  const outputs = arraify(config.build.rollupOptions?.output)
  return outputs.some(
    (output) => output?.format === 'es' || output?.format === 'esm'
  )
}
