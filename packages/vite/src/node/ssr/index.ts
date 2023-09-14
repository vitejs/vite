import type { DepOptimizationConfig } from '../optimizer'

export type SSRTarget = 'node' | 'webworker'

/**
 * @deprecated SSR build output is now always ESM
 */
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
   * Define the format for the ssr build. Since Vite v5 this option is ignored.
   * @experimental
   * @deprecated SSR build output is now always ESM
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
  optimizeDeps: SsrDepOptimizationOptions
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
      disabled: true,
      ...optimizeDeps,
      esbuildOptions: {
        preserveSymlinks,
        ...optimizeDeps.esbuildOptions,
      },
    },
  }
}
