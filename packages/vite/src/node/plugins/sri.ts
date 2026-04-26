import { createHash } from 'node:crypto'
import type { OutputBundle, PluginContext } from 'rolldown'
import type { SRIHashAlgorithm } from '../build'
import { perEnvironmentState } from '../environment'
import type { Plugin } from '../plugin'

type SRIState = {
  integrityByFile: Map<string, string>
}

export const getSriState: (context: PluginContext) => SRIState =
  perEnvironmentState<SRIState>(() => ({
    integrityByFile: new Map(),
  }))

const isJsFile = (fileName: string): boolean =>
  fileName.endsWith('.js') ||
  fileName.endsWith('.mjs') ||
  fileName.endsWith('.cjs')

const isCssFile = (fileName: string): boolean => fileName.endsWith('.css')

const generateIntegrity = (
  content: string | Uint8Array,
  algorithm: SRIHashAlgorithm,
): string => {
  const hash = createHash(algorithm)
  hash.update(content)
  return `${algorithm}-${hash.digest('base64')}`
}

const generateBundleIntegrity = (
  bundle: OutputBundle,
  algorithm: SRIHashAlgorithm,
  integrityByFile: Map<string, string>,
): void => {
  for (const fileName in bundle) {
    const output = bundle[fileName]

    if (output.type === 'chunk') {
      if (isJsFile(output.fileName)) {
        integrityByFile.set(
          output.fileName,
          generateIntegrity(output.code, algorithm),
        )
      }
      continue
    }

    if (isCssFile(output.fileName)) {
      integrityByFile.set(
        output.fileName,
        generateIntegrity(output.source, algorithm),
      )
    }
  }
}

export const sriPlugin = (): Plugin => {
  return {
    name: 'vite:sri',

    applyToEnvironment(environment) {
      return (
        environment.config.consumer === 'client' &&
        !!environment.config.build.sri &&
        !environment.config.build.lib
      )
    },

    buildStart() {
      getSriState(this).integrityByFile.clear()
    },

    generateBundle(_, bundle) {
      const state = getSriState(this)
      state.integrityByFile.clear()

      const algorithm = this.environment.config.build.sri as SRIHashAlgorithm

      generateBundleIntegrity(bundle, algorithm, state.integrityByFile)
    },

    closeBundle() {
      getSriState(this).integrityByFile.clear()
    },
  }
}
