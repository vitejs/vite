import colors from 'picocolors'
import type { ResolvedConfig } from './config'

// TODO: switch to production docs URL
const docsURL = 'https://deploy-preview-16471--vite-docs-main.netlify.app'

export interface FutureDeprecationWarningsOptions {
  pluginHookHandleHotUpdate?: boolean
  pluginHookSsrArgument?: boolean

  serverModuleGraph?: boolean
  serverHot?: boolean
  serverTransformRequest?: boolean

  ssrLoadModule?: boolean
}

const deprecationCode = {
  pluginHookSsrArgument: 'changes/this-environment-in-hooks',
  pluginHookHandleHotUpdate: 'changes/hotupdate-hook',

  serverModuleGraph: 'changes/per-environment-apis',
  serverHot: 'changes/per-environment-apis',
  serverTransformRequest: 'changes/per-environment-apis',

  ssrLoadModule: 'changes/ssr-using-modulerunner',
} satisfies Record<keyof FutureDeprecationWarningsOptions, string>

const deprecationMessages = {
  pluginHookSsrArgument:
    "Plugin hook `options.ssr` is replaced with `this.environment.config.consumer === 'server'`.",
  pluginHookHandleHotUpdate:
    'Plugin hook `handleHotUpdate()` is replaced with `hotUpdate()`.',

  serverModuleGraph:
    'The `server.moduleGraph` is replaced with `this.environment.moduleGraph`.',
  serverHot: 'The `server.hot` is replaced with `this.environment.hot`.',
  serverTransformRequest:
    'The `server.transformRequest` is replaced with `this.environment.transformRequest`.',

  ssrLoadModule:
    'The `server.ssrLoadModule` is replaced with Environment Runner.',
} satisfies Record<keyof FutureDeprecationWarningsOptions, string>

let _ignoreDeprecationWarnings = false

// Later we could have a `warnDeprecation` utils when the deprecation is landed
/**
 * Warn about future deprecations.
 */
export function warnFutureDeprecation(
  config: ResolvedConfig,
  type: keyof FutureDeprecationWarningsOptions,
  extraMessage?: string,
  stacktrace = true,
): void {
  if (_ignoreDeprecationWarnings) return

  if (!config.future?.deprecationWarnings) return

  if (
    config.future.deprecationWarnings !== true &&
    !config.future.deprecationWarnings[type]
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
