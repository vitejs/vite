export type SSRTarget = 'node' | 'webworker'
export type SSRFormat = 'esm' | 'cjs'

export interface SSROptions {
  external?: string[]
  noExternal?: string | RegExp | (string | RegExp)[] | true
  /**
   * Define the target for the ssr build. The browser field in package.json
   * is ignored for node but used if webworker is the target
   * Default: 'node'
   */
  target?: SSRTarget
  /**
   * Define the format for the ssr build. Since Vite v3 the SSR build generates ESM by default.
   * `'cjs'` can be selected to generate a CJS build, but it isn't recommended. This option is
   * left marked as experimental to give users more time to update to ESM. CJS builds requires
   * complex externalization heuristics that aren't present in the ESM format.
   * @experimental
   */
  format?: SSRFormat
}

export interface ResolvedSSROptions extends SSROptions {
  target: SSRTarget
  format: SSRFormat
}

export function resolveSSROptions(
  ssr: SSROptions | undefined
): ResolvedSSROptions | undefined {
  if (ssr === undefined) {
    return undefined
  }
  return {
    format: 'esm',
    target: 'node',
    ...ssr
  }
}
