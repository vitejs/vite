import type { Logger } from './logger'
import type { ResolvedConfig, ResolvedEnvironmentOptions } from './config'

export class Environment {
  name: string
  config: ResolvedConfig
  options: ResolvedEnvironmentOptions
  get logger(): Logger {
    return this.config.logger
  }
  constructor(
    name: string,
    config: ResolvedConfig,
    options: ResolvedEnvironmentOptions,
  ) {
    this.name = name
    this.config = config
    this.options = options
  }
}
