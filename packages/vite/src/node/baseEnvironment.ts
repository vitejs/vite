import colors from 'picocolors'
import type { OutputBundle } from 'rolldown'
import type { Logger } from './logger'
import type {
  RequestEntrypointOutput,
  ResolvedConfig,
  ResolvedEnvironmentOptions,
  ResolvedRequestEntrypoint,
} from './config'
import type { Plugin } from './plugin'
import { resolveRequestEntrypointChunks } from './plugins/requestEntrypoints'

const environmentColors = [
  colors.blue,
  colors.magenta,
  colors.green,
  colors.gray,
]

export class PartialEnvironment {
  name: string
  getTopLevelConfig(): ResolvedConfig {
    return this._topLevelConfig
  }

  config: ResolvedConfig & ResolvedEnvironmentOptions

  logger: Logger

  /**
   * @internal
   */
  _options: ResolvedEnvironmentOptions
  /**
   * @internal
   */
  _topLevelConfig: ResolvedConfig

  constructor(
    name: string,
    topLevelConfig: ResolvedConfig,
    options: ResolvedEnvironmentOptions = topLevelConfig.environments[name],
  ) {
    // only allow some characters so that we can use name without escaping for directory names
    // and make users easier to access with `environments.*`
    if (!/^[\w$]+$/.test(name)) {
      throw new Error(
        `Invalid environment name "${name}". Environment names must only contain alphanumeric characters and "$", "_".`,
      )
    }
    this.name = name
    this._topLevelConfig = topLevelConfig
    this._options = options
    this.config = new Proxy(
      options as ResolvedConfig & ResolvedEnvironmentOptions,
      {
        get: (target, prop: keyof ResolvedConfig) => {
          if (prop === 'logger') {
            return this.logger
          }
          if (prop in target) {
            return this._options[prop as keyof ResolvedEnvironmentOptions]
          }
          return this._topLevelConfig[prop]
        },
      },
    )
    const environment = colors.dim(`(${this.name})`)
    const colorIndex =
      [...this.name].reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      environmentColors.length
    const infoColor = environmentColors[colorIndex || 0]
    this.logger = {
      get hasWarned() {
        return topLevelConfig.logger.hasWarned
      },
      info(msg, opts) {
        return topLevelConfig.logger.info(msg, {
          ...opts,
          environment: infoColor(environment),
        })
      },
      warn(msg, opts) {
        return topLevelConfig.logger.warn(msg, {
          ...opts,
          environment: colors.yellow(environment),
        })
      },
      warnOnce(msg, opts) {
        return topLevelConfig.logger.warnOnce(msg, {
          ...opts,
          environment: colors.yellow(environment),
        })
      },
      error(msg, opts) {
        return topLevelConfig.logger.error(msg, {
          ...opts,
          environment: colors.red(environment),
        })
      },
      clearScreen(type) {
        return topLevelConfig.logger.clearScreen(type)
      },
      hasErrorLogged(error) {
        return topLevelConfig.logger.hasErrorLogged(error)
      },
    }
  }
}

export class BaseEnvironment extends PartialEnvironment {
  get plugins(): readonly Plugin[] {
    return this.config.plugins
  }

  /**
   * The normalized server request entrypoints configured for this environment.
   *
   * @experimental
   */
  getRequestEntrypoints(): ResolvedRequestEntrypoint[] {
    return this.config.requestEntrypoints
  }

  /**
   * Resolve each configured request entrypoint to its emitted entry chunk in the given bundle.
   * Intended to generally be called from a deployment provider plugin's `generateBundle` hook via
   * `this.environment.getRequestEntrypointOutputs(bundle)`.
   *
   * @experimental
   */
  getRequestEntrypointOutputs(bundle: OutputBundle): RequestEntrypointOutput[] {
    const entrypoints = this.getRequestEntrypoints()
    const chunkByName = resolveRequestEntrypointChunks(
      bundle,
      entrypoints,
      this.name,
    )
    return entrypoints.map(({ name, type }) => {
      const chunk = chunkByName.get(name)!
      return { name, type, fileName: chunk.fileName, chunk }
    })
  }

  /**
   * @internal
   */
  _initiated: boolean = false

  constructor(
    name: string,
    config: ResolvedConfig,
    options: ResolvedEnvironmentOptions = config.environments[name],
  ) {
    super(name, config, options)
  }
}

/**
 * This class discourages users from inversely checking the `mode`
 * to determine the type of environment, e.g.
 *
 * ```js
 * const isDev = environment.mode !== 'build' // bad
 * const isDev = environment.mode === 'dev'   // good
 * ```
 *
 * You should also not check against `"unknown"` specifically. It's
 * a placeholder for more possible environment types.
 */
export class UnknownEnvironment extends BaseEnvironment {
  mode = 'unknown' as const
}
