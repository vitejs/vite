// @ts-check
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from '..'
import { getCodeWithSourcemap } from '../server/sourcemap'
import { shouldExternalizeForSSR } from './ssrExternal'

const server = await createServer({
  appType: 'custom'
})

await server.listen()
server.printUrls()
;(globalThis as any).__vite_server__ = server

function unwrapSpecifier(specifier: string, forNode: boolean) {
  if (!forNode && specifier.startsWith('file:')) {
    return fileURLToPath(specifier)
  } else if (specifier.startsWith('vite:')) {
    return specifier.slice(5)
  } else if (specifier.startsWith('/@id/')) {
    return specifier.slice(5)
  } else if (specifier.startsWith('/@fs/')) {
    return specifier.slice(4)
  } else {
    return specifier
  }
}

interface ResolveContext {
  /** Export conditions of the relevant package.json */
  conditions: string[]
  /** Import assertions */
  importAssertions: any
  /** The module importing this one, or undefined if this is the Node.js entry point */
  parentURL?: string
}

interface ResolveResult {
  /** A hint to the load hook (it might be ignored) */
  format?: null | 'builtin' | 'commonjs' | 'json' | 'module' | 'wasm'
  /** A signal that this hook intends to terminate the chain of resolve hooks. Default: false */
  shortCircuit?: boolean
  /** The absolute URL to which this input resolves */
  url: string
}

export async function resolve(
  specifier: string,
  context: ResolveContext,
  next: (specifier: string, context: ResolveContext) => Promise<ResolveResult>
): Promise<ResolveResult> {
  if (
    (!context.parentURL || context.parentURL.startsWith('vite:')) &&
    !shouldExternalizeForSSR(specifier, server.config)
  ) {
    const resolved = await server.pluginContainer.resolveId(
      unwrapSpecifier(specifier, false),
      context.parentURL && unwrapSpecifier(context.parentURL, false),
      {
        isEntry: !context.parentURL,
        ssr: true
      }
    )

    if (resolved && !resolved.external) {
      const ts = server.moduleGraph.getModuleById(
        resolved.id
      )?.lastInvalidationTimestamp

      if (ts) {
        resolved.id += `?t=${ts}`
      }

      return {
        url: resolved.external ? resolved.id : `vite:${resolved.id}`
      }
    }
  }

  if (context.parentURL?.startsWith('vite:')) {
    context.parentURL = pathToFileURL(context.parentURL.slice(5)).href
  }

  specifier = unwrapSpecifier(specifier, true)

  return next(specifier, context)
}

interface LoaderContext {
  /** Export conditions of the relevant package.json */
  conditions: string[]
  /** The format optionally supplied by the resolve hook chain */
  format?: string | null
  /** Import assertions */
  importAssertions: any
}

interface LoaderResult {
  format: string
  /** A signal that this hook intends to terminate the chain of resolve hooks. Default: false */
  shortCircuit?: boolean
  /** The source for Node.js to evaluate */
  source: string | ArrayBuffer | Uint8Array
}

export async function load(
  url: string,
  context: LoaderContext,
  next: (url: string, context: LoaderContext) => Promise<LoaderResult>
): Promise<LoaderResult> {
  if (url.startsWith('vite:')) {
    const result = await server.transformRequest(url.slice(5), {
      ssr: 'loader'
    })

    if (result) {
      const { map } = result

      if (map && map.mappings) {
        result.code = getCodeWithSourcemap('js', result.code.toString(), map)
      }

      return {
        source: result.code,
        format: 'module'
      }
    }
  }

  if (url.startsWith('vite:')) {
    url = url.slice(5)
  }

  return next(url, context)
}
