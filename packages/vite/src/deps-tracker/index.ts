import type { MessagePort } from 'node:worker_threads'
import type { InitializeHook, ResolveHook } from 'node:module'

const tQueryRE = /(?:\?|&)t=(\d+)(?:&|$)/
const relativeImportRE = /^\.{1,2}(?:\/|\\)/

let port: MessagePort
let enabled = false

export const initialize: InitializeHook = async ({
  port: _port,
  time: _time,
}: {
  port: MessagePort
  time: string
}) => {
  port = _port
  port.on('message', (_enabled) => {
    enabled = _enabled
  })
}

export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  const isRelativeImport = relativeImportRE.test(specifier)
  const result = await nextResolve(specifier, context)
  if (result.format === 'builtin' || !isRelativeImport) return result

  if (
    // when tracking is not enabled
    !enabled ||
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
    // all dependencies from the config should have the t query
    port.postMessage(result.url)

    result.url = result.url.replace(
      /(\?)|$/,
      (_n, n1) => `?t=${m[1]}${n1 === '?' ? '&' : ''}`,
    )
  }
  return result
}
