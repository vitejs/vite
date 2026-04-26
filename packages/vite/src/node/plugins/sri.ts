import { createHash } from 'node:crypto'
import type {
  OutputAsset,
  OutputBundle,
  OutputChunk,
  PluginContext,
} from 'rolldown'
import type { SRIHashAlgorithm } from '../build'
import { perEnvironmentState } from '../environment'
import type { Plugin } from '../plugin'

type SRIState = {
  fileToPlaceholder: Map<string, string>
  placeholderToFile: Map<string, string>
  dependenciesByOwnerFile: Map<string, Set<string>>
  integrityByFile: Map<string, string>
}

type SRIOutputs = {
  htmlAssets: OutputAsset[]
  nodesByFile: Map<string, ChunkNode>
}

type ChunkNode = {
  chunk: OutputChunk
  shouldResolvePlaceholders: boolean
  unresolvedCount: number
}

type ChunkGraph = {
  dependentsByFile: Map<string, string[]>
  nodesByFile: Map<string, ChunkNode>
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

const createSriPlaceholderStringRE = (algorithm: SRIHashAlgorithm): RegExp => {
  const placeholderLength = integrityLengthByAlgorithm[algorithm]
  const suffixLength = placeholderLength - sriPlaceholderPrefix.length

  return new RegExp(
    `(["'])(${sriPlaceholderPrefix}[A-Z0-9_]{${suffixLength}})\\1`,
    'g',
  )
}

export const getSriState: (context: PluginContext) => SRIState =
  perEnvironmentState<SRIState>(() => ({
    fileToPlaceholder: new Map(),
    placeholderToFile: new Map(),
    dependenciesByOwnerFile: new Map(),
    integrityByFile: new Map(),
  }))

const clearTransientState = (state: SRIState): void => {
  state.fileToPlaceholder.clear()
  state.placeholderToFile.clear()
  state.dependenciesByOwnerFile.clear()
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

/**
 * Creates a fixed-width SRI placeholder for HTML assets.
 *
 * HTML is resolved after JS/CSS integrity values are finalized, so HTML
 * placeholders don't participate in the JS preload dependency graph. Any
 * unresolved HTML placeholder is treated as an internal error.
 */
export const createSriHtmlPlaceholder = (
  context: PluginContext,
  fileName: string,
): string => createSriPlaceholder(context, fileName)

/**
 * Creates a fixed-width SRI placeholder for JS preload metadata and records the
 * `ownerFileName -> dependencyFileName` edge used to resolve integrity values.
 *
 * Cyclic preload references may be replaced with `void 0` to omit the runtime
 * `integrity` value instead of emitting an incorrect hash.
 */
export const createSriDependencyPlaceholder = (
  context: PluginContext,
  ownerFileName: string,
  dependencyFileName: string,
): string => {
  const placeholder = createSriPlaceholder(context, dependencyFileName)
  const state = getSriState(context)

  let dependencies = state.dependenciesByOwnerFile.get(ownerFileName)
  if (!dependencies) {
    dependencies = new Set<string>()
    state.dependenciesByOwnerFile.set(ownerFileName, dependencies)
  }

  dependencies.add(dependencyFileName)
  return placeholder
}

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
  const nodesByFile = new Map<string, ChunkNode>()

  for (const fileName in bundle) {
    const output = bundle[fileName]

    if (output.type === 'chunk') {
      if (isJsFile(output.fileName)) {
        nodesByFile.set(output.fileName, {
          chunk: output,
          shouldResolvePlaceholders: false,
          unresolvedCount: 0,
        })
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

  return { htmlAssets, nodesByFile }
}

const buildChunkGraph = (
  nodesByFile: Map<string, ChunkNode>,
  state: SRIState,
): ChunkGraph => {
  const dependentsByFile = new Map<string, string[]>()

  for (const [ownerFileName, node] of nodesByFile) {
    const dependencies = state.dependenciesByOwnerFile.get(ownerFileName)
    if (!dependencies || dependencies.size === 0) {
      continue
    }

    node.shouldResolvePlaceholders = true

    for (const dependencyFileName of dependencies) {
      if (state.integrityByFile.has(dependencyFileName)) {
        continue
      }

      if (!nodesByFile.has(dependencyFileName)) {
        continue
      }

      node.unresolvedCount += 1

      let dependents = dependentsByFile.get(dependencyFileName)
      if (!dependents) {
        dependents = []
        dependentsByFile.set(dependencyFileName, dependents)
      }

      dependents.push(ownerFileName)
    }
  }

  return { dependentsByFile, nodesByFile }
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

const resolveReadyChunks = (
  graph: ChunkGraph,
  state: SRIState,
  algorithm: SRIHashAlgorithm,
  placeholderRE: RegExp,
): void => {
  const readyQueue: ChunkNode[] = []

  for (const node of graph.nodesByFile.values()) {
    if (node.unresolvedCount === 0) {
      readyQueue.push(node)
    }
  }

  let readyIndex = 0

  while (readyIndex < readyQueue.length) {
    const node = readyQueue[readyIndex++]!
    const fileName = node.chunk.fileName

    if (!graph.nodesByFile.delete(fileName)) {
      continue
    }

    if (node.shouldResolvePlaceholders) {
      node.chunk.code = replaceSriPlaceholders(
        node.chunk.code,
        state,
        fileName,
        placeholderRE,
      )
    }

    state.integrityByFile.set(
      fileName,
      generateIntegrity(node.chunk.code, algorithm),
    )

    for (const dependentFileName of graph.dependentsByFile.get(fileName) ??
      []) {
      const dependent = graph.nodesByFile.get(dependentFileName)
      if (!dependent) {
        continue
      }

      dependent.unresolvedCount -= 1

      if (dependent.unresolvedCount === 0) {
        readyQueue.push(dependent)
      }
    }
  }
}

const createWidthPreservingVoidExpression = (targetLength: number): string => {
  const expression = 'void 0'
  const commentStart = '/*'
  const commentEnd = '*/'

  const commentPaddingLength =
    targetLength - expression.length - commentStart.length - commentEnd.length

  if (commentPaddingLength < 0) {
    throw new Error('SRI fallback replacement is longer than the placeholder')
  }

  return `${expression}${commentStart}${'_'.repeat(commentPaddingLength)}${commentEnd}`
}

const replaceSriDependencyPlaceholders = (
  content: string,
  state: SRIState,
  placeholderStringRE: RegExp,
  unresolvedNodesByFile: Map<string, ChunkNode>,
): string =>
  content.replace(
    placeholderStringRE,
    (match, _quote: string, placeholder: string) => {
      const fileName = state.placeholderToFile.get(placeholder)
      if (!fileName) {
        return match
      }

      if (unresolvedNodesByFile.has(fileName)) {
        return createWidthPreservingVoidExpression(match.length)
      }

      const integrity = state.integrityByFile.get(fileName)
      if (integrity === undefined) {
        return createWidthPreservingVoidExpression(match.length)
      }

      return JSON.stringify(integrity)
    },
  )

const resolveUnresolvedChunks = (
  graph: ChunkGraph,
  state: SRIState,
  algorithm: SRIHashAlgorithm,
  placeholderStringRE: RegExp,
): void => {
  for (const node of graph.nodesByFile.values()) {
    node.chunk.code = replaceSriDependencyPlaceholders(
      node.chunk.code,
      state,
      placeholderStringRE,
      graph.nodesByFile,
    )

    state.integrityByFile.set(
      node.chunk.fileName,
      generateIntegrity(node.chunk.code, algorithm),
    )
  }

  graph.nodesByFile.clear()
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
      const placeholderStringRE = createSriPlaceholderStringRE(algorithm)

      const { htmlAssets, nodesByFile } = collectSriOutputs(
        bundle,
        algorithm,
        state.integrityByFile,
      )

      const graph = buildChunkGraph(nodesByFile, state)

      resolveReadyChunks(graph, state, algorithm, placeholderRE)

      if (graph.nodesByFile.size > 0) {
        resolveUnresolvedChunks(graph, state, algorithm, placeholderStringRE)
      }

      resolveHtmlAssets(htmlAssets, state, placeholderRE)

      clearTransientState(state)
    },

    closeBundle() {
      clearState(getSriState(this))
    },
  }
}
