import type { DepOptimizationConfig } from '../optimizer'

export type SSRTarget = 'node' | 'webworker'
export type SSRFormat = 'esm' | 'cjs'

export type SsrDepOptimizationOptions = DepOptimizationConfig

export interface SSROptions {
  noExternal?: string | RegExp | (string | RegExp)[] | true
  external?: string[]
  /**
   * Define the target for the ssr build. The browser field in package.json
   * is ignored for node but used if webworker is the target
   * @default 'node'
   */
  target?: SSRTarget
  /**
   * Define the format for the ssr build. Since Vite v3 the SSR build generates ESM by default.
   * `'cjs'` can be selected to generate a CJS build, but it isn't recommended. This option is
   * left marked as experimental to give users more time to update to ESM. CJS builds requires
   * complex externalization heuristics that aren't present in the ESM format.
   * @experimental
   * @default 'esm'
   */
  format?: SSRFormat
  /**
   * Control over which dependencies are optimized during SSR and esbuild options
   * During build:
   *   no external CJS dependencies are optimized by default
   * During dev:
   *   explicit no external CJS dependencies are optimized by default
   * @experimental
   */
  optimizeDeps?: SsrDepOptimizationOptions
}

export interface ResolvedSSROptions extends SSROptions {
  target: SSRTarget
  format: SSRFormat
  optimizeDeps: SsrDepOptimizationOptions
}

export function resolveSSROptions(
  ssr: SSROptions | undefined,
  preserveSymlinks: boolean,
  buildSsrCjsExternalHeuristics?: boolean,
): ResolvedSSROptions {
  ssr ??= {}
  const optimizeDeps = ssr.optimizeDeps ?? {}
  const format: SSRFormat = buildSsrCjsExternalHeuristics ? 'cjs' : 'esm'
  const target: SSRTarget = 'node'
  return {
    format,
    target,
    ...ssr,
    optimizeDeps: {
      disabled: true,
      ...optimizeDeps,
      esbuildOptions: {
        preserveSymlinks,
        ...optimizeDeps.esbuildOptions,
      },
    },
  }
}
