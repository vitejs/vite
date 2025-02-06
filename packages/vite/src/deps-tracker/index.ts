import type { MessagePort } from 'node:worker_threads'
import type { InitializeHook, ResolveHook } from 'node:module'

const tQueryRE = /(?:\?|&)t=(\d+),([^&]+)(?:&|$)/
const relativeImportRE = /^\.{1,2}(?:\/|\\)/

let port: MessagePort

export const initialize: InitializeHook = async ({
  port: _port,
  time: _time,
}: {
  port: MessagePort
  time: string
}) => {
  port = _port
}

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  const isRelativeImport = relativeImportRE.test(specifier)
  const result = await nextResolve(specifier, context)
  if (result.format === 'builtin' || !isRelativeImport) return result

  if (
    // when parent does not exist (it is not a dependency of config file)
    !context.parentURL ||
    // if the t query is already present, do not add it
    tQueryRE.test(result.url) ||
    // if it's not a file url, no need to add the t query
    !result.url.startsWith('file:')
  )
    return result

  // propergate the t query
  const m = tQueryRE.exec(context.parentURL)
  if (m) {
    const [, time, contextFile] = m
    // all dependencies from the config should have the t query
    port.postMessage({ context: contextFile, url: result.url })

    result.url = result.url.replace(
      /(\?)|$/,
      (_n, n1) => `?t=${time},${contextFile}${n1 === '?' ? '&' : ''}`,
    )
  }
  return result
}
