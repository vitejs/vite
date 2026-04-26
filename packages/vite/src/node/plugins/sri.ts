import { createHash } from 'node:crypto'
import type { OutputAsset, OutputBundle, PluginContext } from 'rolldown'
import type { SRIHashAlgorithm } from '../build'
import { perEnvironmentState } from '../environment'
import type { Plugin } from '../plugin'

type SRIState = {
  fileToPlaceholder: Map<string, string>
  placeholderToFile: Map<string, string>
  integrityByFile: Map<string, string>
}

type SRIOutputs = {
  htmlAssets: OutputAsset[]
}

const integrityLengthByAlgorithm: Record<SRIHashAlgorithm, number> = {
  sha256: 51,
  sha384: 71,
  sha512: 95,
}

const sriPlaceholderPrefix = '__VITE_SRI_'

const createSriPlaceholderRE = (algorithm: SRIHashAlgorithm): RegExp => {
  const placeholderLength = integrityLengthByAlgorithm[algorithm]
  const suffixLength = placeholderLength - sriPlaceholderPrefix.length

  return new RegExp(`${sriPlaceholderPrefix}[A-Z0-9_]{${suffixLength}}`, 'g')
}

export const getSriState: (context: PluginContext) => SRIState =
  perEnvironmentState<SRIState>(() => ({
    fileToPlaceholder: new Map(),
    placeholderToFile: new Map(),
    integrityByFile: new Map(),
  }))

const clearTransientState = (state: SRIState): void => {
  state.fileToPlaceholder.clear()
  state.placeholderToFile.clear()
}

const clearState = (state: SRIState): void => {
  clearTransientState(state)
  state.integrityByFile.clear()
}

const isJsFile = (fileName: string): boolean =>
  fileName.endsWith('.js') ||
  fileName.endsWith('.mjs') ||
  fileName.endsWith('.cjs')

const isCssFile = (fileName: string): boolean => fileName.endsWith('.css')

export const isSriFile = (fileName: string): boolean =>
  isJsFile(fileName) || isCssFile(fileName)

const createSriPlaceholder = (
  context: PluginContext,
  fileName: string,
): string => {
  const state = getSriState(context)
  const existing = state.fileToPlaceholder.get(fileName)
  if (existing) {
    return existing
  }

  const algorithm = context.environment.config.build.sri
  if (!algorithm) {
    throw new Error(
      'SRI placeholder cannot be created when build.sri is disabled',
    )
  }

  const targetLength = integrityLengthByAlgorithm[algorithm]
  const id = state.fileToPlaceholder.size.toString(36).toUpperCase()
  const base = `${sriPlaceholderPrefix}${id}_`
  const placeholder = `${base}${'_'.repeat(targetLength - base.length)}`

  state.fileToPlaceholder.set(fileName, placeholder)
  state.placeholderToFile.set(placeholder, fileName)

  return placeholder
}

export const createSriHtmlPlaceholder = (
  context: PluginContext,
  fileName: string,
): string => createSriPlaceholder(context, fileName)

const generateIntegrity = (
  content: string | Uint8Array,
  algorithm: SRIHashAlgorithm,
): string => {
  const hash = createHash(algorithm)
  hash.update(content)
  return `${algorithm}-${hash.digest('base64')}`
}

const collectSriOutputs = (
  bundle: OutputBundle,
  algorithm: SRIHashAlgorithm,
  integrityByFile: Map<string, string>,
): SRIOutputs => {
  const htmlAssets: OutputAsset[] = []

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
      continue
    }

    if (output.fileName.endsWith('.html')) {
      htmlAssets.push(output)
    }
  }

  return { htmlAssets }
}

const formatUnresolvedPlaceholderError = (
  ownerFileName: string,
  unresolvedFiles: Iterable<string>,
): string =>
  `Unable to resolve all SRI placeholders in ${ownerFileName}.\n` +
  `This is likely an internal error: a placeholder was emitted without a matching SRI file.\n` +
  [...unresolvedFiles].map((file) => `  - ${file}`).join('\n')

const replaceSriPlaceholders = (
  content: string,
  state: SRIState,
  ownerFileName: string,
  placeholderRE: RegExp,
): string => {
  const unresolvedFiles = new Set<string>()

  const replaced = content.replace(placeholderRE, (placeholder) => {
    const fileName = state.placeholderToFile.get(placeholder)
    if (!fileName) {
      return placeholder
    }

    const integrity = state.integrityByFile.get(fileName)
    if (integrity === undefined) {
      unresolvedFiles.add(fileName)
      return placeholder
    }

    return integrity
  })

  if (unresolvedFiles.size !== 0) {
    throw new Error(
      formatUnresolvedPlaceholderError(ownerFileName, unresolvedFiles),
    )
  }

  return replaced
}

const assetSourceToString = (source: OutputAsset['source']): string => {
  return typeof source === 'string'
    ? source
    : Buffer.from(source).toString('utf-8')
}

const resolveHtmlAssets = (
  htmlAssets: OutputAsset[],
  state: SRIState,
  placeholderRE: RegExp,
): void => {
  for (const asset of htmlAssets) {
    asset.source = replaceSriPlaceholders(
      assetSourceToString(asset.source),
      state,
      asset.fileName,
      placeholderRE,
    )
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
      clearState(getSriState(this))
    },

    generateBundle(_, bundle) {
      const state = getSriState(this)
      state.integrityByFile.clear()

      const algorithm = this.environment.config.build.sri as SRIHashAlgorithm
      const placeholderRE = createSriPlaceholderRE(algorithm)

      const { htmlAssets } = collectSriOutputs(
        bundle,
        algorithm,
        state.integrityByFile,
      )

      resolveHtmlAssets(htmlAssets, state, placeholderRE)

      clearTransientState(state)
    },

    closeBundle() {
      clearState(getSriState(this))
    },
  }
}
