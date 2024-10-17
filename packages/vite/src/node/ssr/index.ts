import type { DepOptimizationConfig } from '../optimizer'

export type SSRTarget = 'node' | 'webworker'

export type SsrDepOptimizationConfig = DepOptimizationConfig

export interface SSROptions {
  noExternal?: string | RegExp | (string | RegExp)[] | true
  external?: string[] | true

  /**
   * Define the target for the ssr build. The browser field in package.json
   * is ignored for node but used if webworker is the target
   * This option may be replaced by the experimental `environmentOptions.webCompatible`
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

export function resolveSSROptions(
  ssr: SSROptions | undefined,
  preserveSymlinks: boolean,
): ResolvedSSROptions {
  ssr ??= {}
  const optimizeDeps = ssr.optimizeDeps ?? {}
  const target: SSRTarget = 'node'
  return {
    target,
    ...ssr,
    optimizeDeps: {
      ...optimizeDeps,
      esbuildOptions: {
        preserveSymlinks,
        ...optimizeDeps.esbuildOptions,
      },
    },
  }
}
