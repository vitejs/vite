import type { Logger } from './logger'
import type { ResolvedConfig, ResolvedEnvironmentOptions } from './config'

export class Environment {
  name: string
  config: ResolvedConfig
  options: ResolvedEnvironmentOptions
  get logger(): Logger {
    const logger = this.config.logger
    const format = (msg: string) => {
      return `(${this.name}) ${msg}`
    }
    return {
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
