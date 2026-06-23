import { defineConfig } from 'vite'

// Minimal, framework-free repro for FBM Issue 3 —
// a plugin-injected `/@id/virtual:…` runtime entry point 404s under bundledDev.
//
// `injectVirtualScript()` mirrors what vite-plugin-vue-devtools does in the official
// Vue starter: it injects a `<script type="module" src="/@id/virtual:…">` tag into the
// page via `transformIndexHtml`, and backs that URL with a virtual module via
// resolveId/load. Under normal dev `transformMiddleware` resolves the `/@id/` URL
// through the plugin container; under `bundledDev` that middleware is gated off, so the
// request falls through to a 404.
//
// bundledDev ON by default; `VITE_NO_FBM=1` turns it OFF (the non-FBM baseline).
function injectVirtualScript() {
  // Vite's standard virtual-module convention: resolveId returns a `\0`-prefixed id so
  // other plugins skip it; the URL Vite serves for `\0virtual:…` is `/@id/__x00__virtual:…`.
  const VIRTUAL_ID = 'virtual:my-overlay.js'
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  return {
    name: 'inject-virtual-script',
    enforce: 'pre',
    apply: 'serve',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `console.log('[repro] virtual overlay loaded'); window.__overlayLoaded = true;`
      }
    },
    transformIndexHtml() {
      // Inject the virtual-module script at runtime, the same way vue-devtools does.
      // We let Vite encode the URL itself by referencing the bare virtual id under /@id/;
      // Vite rewrites `\0` → `__x00__` in served URLs, so the canonical form is:
      //   /@id/__x00__virtual:my-overlay.js
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          attrs: {
            type: 'module',
            src: '/@id/__x00__virtual:my-overlay.js',
          },
        },
      ]
    },
  }
}

export default defineConfig({
  plugins: [injectVirtualScript()],
  experimental: { bundledDev: !process.env.VITE_NO_FBM },
})
