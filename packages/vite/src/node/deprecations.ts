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
  pluginHookHandleHotUpdate: 'VD001',
  pluginHookSsrArgument: 'VD002',

  serverModuleGraph: 'VD003',
  serverHot: 'VD003',
  serverTransformRequest: 'VD003',

  ssrLoadModule: 'VD004',
} satisfies Record<keyof FutureDeprecationWarningsOptions, string>

const deprecationMessages = {
  pluginHookHandleHotUpdate:
    'Plugin hook `handleHotUpdate()` is replaced with `hotUpdate()`.',
  pluginHookSsrArgument:
    'Plugin hook `options.ssr` is replaced with `this.environment.name !== "client"`.',

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

  let msg = `[vite future] [${deprecationCode[type]}] ${deprecationMessages[type]}`
  if (extraMessage) {
    msg += ` ${extraMessage}`
  }
  msg = colors.yellow(msg)

  const docs = `${docsURL}/deprecations/${deprecationCode[type].toLowerCase()}`
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
