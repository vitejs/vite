import { HMRContext } from '../shared/hmr'
import type { EvaluatedModules } from './evaluatedModules'
import type { ModuleRunner } from './runner'

export class ModuleRunnerHMRContext extends HMRContext {
  public evaluatedModules: EvaluatedModules

  constructor(moduleRunner: ModuleRunner, url: string) {
    if (!moduleRunner.hmrClient) {
      throw new TypeError(
        `Expected moduleRunner to have an HMR client. This is an error in Vite.`,
      )
    }
    super(moduleRunner.hmrClient, url)
    this.evaluatedModules = moduleRunner.evaluatedModules
  }
}
