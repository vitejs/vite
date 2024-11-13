import type { DepOptimizationConfig } from '../optimizer'
import { mergeWithDefaults } from '../utils'

export type SSRTarget = 'node' | 'webworker'

export type SsrDepOptimizationConfig = DepOptimizationConfig

export interface SSROptions {
  noExternal?: string | RegExp | (string | RegExp)[] | true
  external?: string[] | true

  /**
   * Define the target for the ssr build. The browser field in package.json
   * is ignored for node but used if webworker is the target
   * This option will be removed in a future major version
   * @default 'node'
   */
  target?: SSRTarget

  /**
   * Control over which dependencies are optimized during SSR and esbuild options
   * During build:
   *   no external CJS dependencies are optimized by default
   * During dev:
   *   explicit no external CJS dependencies are optimized by default
   * @experimental
   */
  optimizeDeps?: SsrDepOptimizationConfig

  resolve?: {
    /**
     * Conditions that are used in the plugin pipeline. The default value is the root config's `resolve.conditions`.
     *
     * Use this to override the default ssr conditions for the ssr build.
     *
     * @default rootConfig.resolve.conditions
     */
    conditions?: string[]

    /**
     * Conditions that are used during ssr import (including `ssrLoadModule`) of externalized dependencies.
     *
     * @default []
     */
    externalConditions?: string[]
  }
}

export interface ResolvedSSROptions extends SSROptions {
  target: SSRTarget
  optimizeDeps: SsrDepOptimizationConfig
}

export const ssrConfigDefaults = Object.freeze({
  // noExternal
  // external
  target: 'node',
  optimizeDeps: {},
  // resolve
} satisfies SSROptions)

export function resolveSSROptions(
  ssr: SSROptions | undefined,
  preserveSymlinks: boolean,
): ResolvedSSROptions {
  const defaults = mergeWithDefaults(ssrConfigDefaults, {
    optimizeDeps: { esbuildOptions: { preserveSymlinks } },
  } satisfies SSROptions)
  return mergeWithDefaults(defaults, ssr ?? {})
}
