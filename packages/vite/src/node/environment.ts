import type { Logger } from './logger'
import type { ResolvedConfig, ResolvedEnvironmentOptions } from './config'

export class Environment {
  name: string
  config: ResolvedConfig
  options: ResolvedEnvironmentOptions
  #logger: Logger | undefined
  get logger(): Logger {
    if (this.#logger) {
      return this.#logger
    }
    const logger = this.config.logger
    const format = (msg: string) => {
      return `(${this.name}) ${msg}`
    }
    this.#logger = {
      get hasWarned() {
        return logger.hasWarned
      },
      info(msg, opts) {
        return logger.info(format(msg), opts)
      },
      warn(msg, opts) {
        return logger.warn(format(msg), opts)
      },
      warnOnce(msg, opts) {
        return logger.warnOnce(format(msg), opts)
      },
      error(msg, opts) {
        return logger.error(format(msg), opts)
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
