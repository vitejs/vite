import colors from 'picocolors'
import type { Logger } from './logger'
import type { ResolvedConfig, ResolvedEnvironmentOptions } from './config'
import type { BoundedPlugin } from './plugin'

export class Environment {
  name: string

  config: ResolvedConfig
  options: ResolvedEnvironmentOptions

  get plugins(): BoundedPlugin[] {
    if (!this._plugins)
      throw new Error(
        `${this.name} environment.plugins called before initialized`,
      )
    return this._plugins
  }
  /**
   * @internal
   */
  _plugins: BoundedPlugin[] | undefined
  /**
   * @internal
   */
  _inited: boolean = false

  #logger: Logger | undefined
  get logger(): Logger {
    if (this.#logger) {
      return this.#logger
    }
    const environment = colors.dim(`(${this.name})`)
    const colorIndex =
      Number([...environment].map((c) => c.charCodeAt(0))) %
      environmentColors.length
    const infoColor = environmentColors[colorIndex || 0]
    const logger = this.config.logger
    this.#logger = {
      get hasWarned() {
        return logger.hasWarned
      },
      info(msg, opts) {
        return logger.info(msg, {
          ...opts,
          environment: infoColor(environment),
        })
      },
      warn(msg, opts) {
        return logger.warn(msg, {
          ...opts,
          environment: colors.yellow(environment),
        })
      },
      warnOnce(msg, opts) {
        return logger.warnOnce(msg, {
          ...opts,
          environment: colors.yellow(environment),
        })
      },
      error(msg, opts) {
        return logger.error(msg, {
          ...opts,
          environment: colors.red(environment),
        })
      },
      clearScreen(type) {
        return logger.clearScreen(type)
      },
      hasErrorLogged(error) {
        return logger.hasErrorLogged(error)
      },
    }
    return this.#logger
  }

  constructor(
    name: string,
    config: ResolvedConfig,
    options: ResolvedEnvironmentOptions = config.environments[name],
  ) {
    this.name = name
    this.config = config
    this.options = options
  }
}

const environmentColors = [
  colors.blue,
  colors.magenta,
  colors.green,
  colors.gray,
]

export function cachedByEnvironment<Data>(
  create: (environment: Environment) => Data,
): (environment: Environment) => Data {
  const cache = new WeakMap<Environment, Data>()
  return function (environment: Environment) {
    let data = cache.get(environment)
    if (!data) {
      data = create(environment)
      cache.set(environment, data)
    }
    return data
  }
}
