import colors from 'picocolors'
import type { FutureOptions, ResolvedConfig } from './config'

// TODO: switch to production docs URL
const docsURL = 'https://deploy-preview-16471--vite-docs-main.netlify.app'

const deprecationCode = {
  removePluginHookSsrArgument: 'changes/this-environment-in-hooks',
  removePluginHookHandleHotUpdate: 'changes/hotupdate-hook',

  removeServerModuleGraph: 'changes/per-environment-apis',
  removeServerHot: 'changes/per-environment-apis',
  removeServerTransformRequest: 'changes/per-environment-apis',

  removeSsrLoadModule: 'changes/ssr-using-modulerunner',
} satisfies Record<keyof FutureOptions, string>

const deprecationMessages = {
  removePluginHookSsrArgument:
    "Plugin hook `options.ssr` is replaced with `this.environment.config.consumer === 'server'`.",
  removePluginHookHandleHotUpdate:
    'Plugin hook `handleHotUpdate()` is replaced with `hotUpdate()`.',

  removeServerModuleGraph:
    'The `server.moduleGraph` is replaced with `this.environment.moduleGraph`.',
  removeServerHot: 'The `server.hot` is replaced with `this.environment.hot`.',
  removeServerTransformRequest:
    'The `server.transformRequest` is replaced with `this.environment.transformRequest`.',

  removeSsrLoadModule:
    'The `server.ssrLoadModule` is replaced with Environment Runner.',
} satisfies Record<keyof FutureOptions, string>

let _ignoreDeprecationWarnings = false

// Later we could have a `warnDeprecation` utils when the deprecation is landed
/**
 * Warn about future deprecations.
 */
export function warnFutureDeprecation(
  config: ResolvedConfig,
  type: keyof FutureOptions,
  extraMessage?: string,
  stacktrace = true,
): void {
  if (
    _ignoreDeprecationWarnings ||
    !config.future ||
    config.future[type] !== 'warn'
  )
    return

  let msg = `[vite future] ${deprecationMessages[type]}`
  if (extraMessage) {
    msg += ` ${extraMessage}`
  }
  msg = colors.yellow(msg)

  const docs = `${docsURL}/changes/${deprecationCode[type].toLowerCase()}`
  msg +=
    colors.gray(`\n  ${stacktrace ? '├' : '└'}─── `) +
    colors.underline(docs) +
    '\n'

  if (stacktrace) {
    const stack = new Error().stack
    if (stack) {
      let stacks = stack
        .split('\n')
        .slice(3)
        .filter((i) => !i.includes('/node_modules/vite/dist/'))
      if (stacks.length === 0) {
        stacks.push('No stack trace found.')
      }
      stacks = stacks.map(
        (i, idx) => `  ${idx === stacks.length - 1 ? '└' : '│'} ${i.trim()}`,
      )
      msg += colors.dim(stacks.join('\n')) + '\n'
    }
  }
  config.logger.warnOnce(msg)
}

export function ignoreDeprecationWarnings<T>(fn: () => T): T {
  const before = _ignoreDeprecationWarnings
  _ignoreDeprecationWarnings = true
  const ret = fn()
  _ignoreDeprecationWarnings = before
  return ret
}
