import type { Plugin } from '../plugin'

/**
 * make sure systemjs register wrap to had complete parameters in system format
 */
export function completeSystemWrapPlugin(): Plugin {
  const SystemJSWrapRE = /System.register\(.*(\(exports\)|\(\))/g

  return {
    name: 'vite:force-systemjs-wrap-complete',

    renderChunk(code, chunk, opts) {
      if (opts.format === 'system') {
        return {
          code: code.replace(SystemJSWrapRE, (s, s1) =>
            s.replace(s1, '(exports, module)'),
          ),
          map: null,
        }
      }
    },
  }
}
