import type { Plugin } from '../plugin'

/**
 * Capture `document.currentScript` before the UMD factory is called.
 *
 * Vite's UMD URL resolution uses `document.currentScript` to resolve relative
 * asset paths. However, `document.currentScript` is only set by the browser
 * during synchronous script execution. When a module loader like RequireJS
 * calls the UMD factory callback asynchronously, `document.currentScript` is
 * `null`, causing a fallback to `document.baseURI` and incorrect URL resolution.
 *
 * This plugin captures `document.currentScript` at the top of the script
 * (while it's still valid) and replaces references inside with the captured
 * value.
 */
export function completeUmdCurrentScriptPlugin(): Plugin {
  return {
    name: 'vite:complete-umd-current-script',
    renderChunk(code, _chunk, opts) {
      if (opts.format !== 'umd') return
      if (!code.includes('document.currentScript')) return

      return {
        code:
          'var __vite_currentScript = typeof document !== "undefined" ? document.currentScript : null;' +
          code.replaceAll('document.currentScript', '__vite_currentScript'),
        map: null,
      }
    },
  }
}
