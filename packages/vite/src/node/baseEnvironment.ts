import colors from 'picocolors'
import type { Logger } from './logger'
import type { ResolvedConfig, ResolvedEnvironmentOptions } from './config'
import type { EnvironmentPlugin } from './plugin'

export class PartialEnvironment {
  name: string
  config: ResolvedConfig
  options: ResolvedEnvironmentOptions
  logger: Logger

  constructor(
    name: string,
    config: ResolvedConfig,
    options: ResolvedEnvironmentOptions = config.environments[name],
  ) {
    this.name = name
    this.config = config
    this.options = options
    const environment = colors.dim(`(${this.name})`)
    const colorIndex =
      [...environment].reduce((acc, c) => acc + c.charCodeAt(0), 0) %
      environmentColors.length
    const infoColor = environmentColors[colorIndex || 0]
    this.logger = {
      get hasWarned() {
        return config.logger.hasWarned
      },
      info(msg, opts) {
        return config.logger.info(msg, {
          ...opts,
          environment: infoColor(environment),
        })
      },
      warn(msg, opts) {
        return config.logger.warn(msg, {
          ...opts,
          environment: colors.yellow(environment),
        })
      },
      warnOnce(msg, opts) {
        return config.logger.warnOnce(msg, {
          ...opts,
          environment: colors.yellow(environment),
        })
      },
      error(msg, opts) {
        return config.logger.error(msg, {
          ...opts,
          environment: colors.red(environment),
        })
      },
      clearScreen(type) {
        return config.logger.clearScreen(type)
      },
      hasErrorLogged(error) {
        return config.logger.hasErrorLogged(error)
      },
    }
  }
}

export class BaseEnvironment extends PartialEnvironment {
  get plugins(): EnvironmentPlugin[] {
    if (!this._plugins)
      throw new Error(
        `${this.name} environment.plugins called before initialized`,
      )
    return this._plugins
  }

  /**
   * @internal
   */
  _plugins: EnvironmentPlugin[] | undefined
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
 * This is used both to avoid users to hardcode conditions like
 * !scan && !build => dev
 */
export class FutureCompatEnvironment extends BaseEnvironment {
  mode = 'futureCompat' as const
}

const environmentColors = [
  colors.blue,
  colors.magenta,
  colors.green,
  colors.gray,
]
