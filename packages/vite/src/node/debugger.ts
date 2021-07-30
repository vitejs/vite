import debug from 'debug'

// set in bin/vite.js
const filter = process.env.VITE_DEBUG_FILTER

const DEBUG = process.env.DEBUG

interface DebuggerOptions {
  onlyWhenFocused?: boolean | string
}

export type ViteDebugScope = `vite:${string}`

export function createDebugger(
  ns: ViteDebugScope,
  options: DebuggerOptions = {}
): debug.Debugger['log'] {
  const log = debug(ns)
  const { onlyWhenFocused } = options
  const focus = typeof onlyWhenFocused === 'string' ? onlyWhenFocused : ns
  return (msg: string, ...args: any[]) => {
    if (filter && !msg.includes(filter)) {
      return
    }
    if (onlyWhenFocused && !DEBUG?.includes(focus)) {
      return
    }
    log(msg, ...args)
  }
}

export const DebugScopes: Record<string, ViteDebugScope> = Object.freeze({
  CACHE: 'vite:cache',
  CONFIG: 'vite:config',
  DEPS: 'vite:deps',
  ESBUILD: 'vite:esbuild',
  HMR: 'vite:hmr',
  LOAD: 'vite:load',
  PLUGIN_RESOLVE: 'vite:plugin-resolve',
  PLUGIN_TRANSFORM: 'vite:plugin-transform',
  PROXY: 'vite:proxy',
  RESOLVE: 'vite:resolve',
  RESOLVE_DETAILS: 'vite:resolve-details',
  REWRITE: 'vite:rewrite',
  SOURCEMAP: 'vite:sourcemap',
  SPA_FALLBACK: 'vite:spa-fallback',
  TIME: 'vite:time',
  TRANSFORM: 'vite:transform'
})
