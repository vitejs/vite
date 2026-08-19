import type { OutputBundle, OutputChunk } from 'rolldown'
import type { Plugin } from '../plugin'
import type { ResolvedRequestEntrypoint } from '../config'

/**
 * Resolve each request entrypoint to its single entry chunk in `bundle`, throwing if a name matches
 * zero or multiple entry chunks. Shared by the eager validation plugin below and
 * `BaseEnvironment.getRequestEntrypointOutputs`, so the matching rules and error messages live in
 * one place.
 *
 * @internal
 */
export function resolveRequestEntrypointChunks(
  bundle: OutputBundle,
  entrypoints: readonly ResolvedRequestEntrypoint[],
  environmentName: string,
): Map<string, OutputChunk> {
  const chunkByName = new Map<string, OutputChunk>()
  if (entrypoints.length === 0) return chunkByName

  const entryChunks = Object.values(bundle).filter(
    (chunk): chunk is OutputChunk => chunk.type === 'chunk' && chunk.isEntry,
  )
  for (const { name } of entrypoints) {
    const matches = entryChunks.filter((chunk) => chunk.name === name)
    if (matches.length === 0) {
      const available =
        [...new Set(entryChunks.map((chunk) => chunk.name))]
          .map((chunkName) => `"${chunkName}"`)
          .join(', ') || 'none'
      throw new Error(
        `Request entrypoint "${name}" in environment "${environmentName}" does not ` +
          `match any entry chunk (available: ${available}). Ensure "${name}" is a ` +
          `"build.rollupOptions.input" entry name and that request entrypoints are ` +
          `resolved during the "generateBundle" hook.`,
      )
    }
    if (matches.length > 1) {
      throw new Error(
        `Request entrypoint "${name}" in environment "${environmentName}" is ambiguous: ` +
          `it matches multiple entry chunks ` +
          `(${matches.map((chunk) => `"${chunk.fileName}"`).join(', ')}). ` +
          `Use the object form of "build.rollupOptions.input" to give each entry a unique name.`,
      )
    }
    chunkByName.set(name, matches[0])
  }
  return chunkByName
}

/**
 * Eagerly validates the environment's `requestEntrypoints` against the emitted bundle (via
 * `resolveRequestEntrypointChunks`), so a misconfiguration fails the build even when no provider
 * plugin reads the entrypoints.
 *
 * Only applies to `consumer: 'server'` environments. Setting them elsewhere is warned about at
 * config resolution rather than failing the build.
 */
export function requestEntrypointsPlugin(): Plugin {
  return {
    name: 'vite:request-entrypoints',
    applyToEnvironment(environment) {
      return environment.config.consumer === 'server'
    },
    generateBundle: {
      // Fail fast before user plugins attempt to access invalid request entrypoints
      order: 'pre',
      handler(_options, bundle) {
        resolveRequestEntrypointChunks(
          bundle,
          this.environment.config.requestEntrypoints,
          this.environment.name,
        )
      },
    },
  }
}
