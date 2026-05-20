import type { Plugin } from '../plugin'
import { perEnvironmentState } from '../environment'
import { sortObjectKeys } from '../utils'
import { getSriState } from './sri'

type SRIManifest = Record<string, string>

const defaultSriManifestFileName = '.vite/sri-manifest.json'

export function sriManifestPlugin(): Plugin {
  const getState = perEnvironmentState(() => {
    return {
      manifest: {} as SRIManifest,
      outputCount: 0,
      reset() {
        this.manifest = {}
        this.outputCount = 0
      },
    }
  })

  return {
    name: 'vite:sri-manifest',

    applyToEnvironment(environment) {
      const { build } = environment.config

      return (
        environment.config.consumer === 'client' &&
        !!build.sri &&
        !build.lib &&
        (!!build.manifest || !!build.ssrManifest)
      )
    },

    generateBundle(_options, bundle) {
      const config = this.environment.config
      const state = getState(this)
      const integrityByFile = getSriState(this).integrityByFile

      for (const [fileName, integrity] of integrityByFile) {
        if (!Object.hasOwn(bundle, fileName)) {
          continue
        }
        const existing = state.manifest[fileName]
        if (existing && existing !== integrity) {
          this.warn(
            `Conflicting SRI values for "${fileName}" across multiple outputs. The last value will be used.`,
          )
        }
        state.manifest[fileName] = integrity
      }

      const output = config.build.rolldownOptions.output
      const outputLength = Array.isArray(output) ? output.length : 1

      state.outputCount += 1

      if (state.outputCount < outputLength) {
        return
      }

      this.emitFile({
        type: 'asset',
        fileName: defaultSriManifestFileName,
        source: JSON.stringify(sortObjectKeys(state.manifest), undefined, 2),
      })

      state.reset()
    },
  }
}
