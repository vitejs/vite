import type { Plugin } from '../plugin'

/**
 * ensure amd bundles request `require` to be injected
 */
export function completeAmdWrapPlugin(): Plugin {
  // const AmdWrapRE =
  //   /\bdefine\((?:\s*\[([^\]]*)\],)?\s*(?:\(\s*)?function\s*\(([^)]*)\)\s*\{/g

  return {
    name: 'vite:force-amd-wrap-require',
    // renderChunk(code, _chunk, opts) {
    //   if (opts.format !== 'amd') return

    //   return {
    //     code: code.replace(AmdWrapRE, (_, deps, params) => {
    //       if (deps?.includes(`"require"`) || deps?.includes(`'require'`)) {
    //         return `define([${deps}], (function(${params}) {`
    //       }

    //       const newDeps = deps ? `"require", ${deps}` : '"require"'
    //       const newParams = params.trim() ? `require, ${params}` : 'require'

    //       return `define([${newDeps}], (function(${newParams}) {`
    //     }),
    //     map: null, // no need to generate sourcemap as no mapping exists for the wrapper
    //   }
    // },
  }
}
