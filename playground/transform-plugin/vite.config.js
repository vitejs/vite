import { resolve } from 'node:path'
import { defineConfig, normalizePath } from 'vite'

const file = normalizePath(resolve(import.meta.dirname, 'index.js'))
let transformCount = 1

const transformPlugin = {
  name: 'transform',
  load(id) {
    if (id === file) {
      // Ensure `index.js` is reloaded if 'plugin-dep-load.js' is changed
      this.addWatchFile('./plugin-dep-load.js')
    }
  },
  transform(code, id) {
    if (id === file) {
      // Ensure `index.js` is reevaluated if 'plugin-dep.js' is changed
      this.addWatchFile('./plugin-dep.js')

      return `
        // Inject TRANSFORM_COUNT
        let TRANSFORM_COUNT = ${transformCount++};

        ${code}
      `
    }
  },
}

const moduleTypePlugins = [
  /** @type {const} */ ...['pre', 'post'].map((enforce) => ({
    name: `module-type-${enforce}`,
    enforce,
    transform(code, id, opts) {
      if (id.endsWith('/foo.json') || id.endsWith('\0/bar.json')) {
        code = code.replace(
          `MODULE_TYPE_${enforce.toUpperCase()}`,
          opts.moduleType,
        )
        return code
      }
    },
  })),
  {
    name: `module-type-load`,
    resolveId(id) {
      if (id === 'virtual:/bar.json') {
        return '\0/bar.json'
      }
    },
    load(id) {
      if (id.endsWith('\0/bar.json')) {
        return JSON.stringify({
          moduleTypePre: 'MODULE_TYPE_PRE',
          moduleTypePost: 'MODULE_TYPE_POST',
        })
      }
    },
  },
]

const lazyHookFilterPlugin = {
  name: 'lazy-hook-filter',
  options() {
    lazyHookFilterPlugin.transform.filter = { id: '**/index.js' }
  },
  transform: {
    filter: /** @type {import('vite').Rolldown.HookFilter} */ ({
      id: { exclude: ['**/*.js'] },
    }),
    handler(code) {
      return code.replaceAll('LAZY_HOOK_FILTER_CONTENT', 'success')
    },
  },
}

export default defineConfig({
  plugins: [transformPlugin, moduleTypePlugins, lazyHookFilterPlugin],
})
