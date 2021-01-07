// @ts-check
const path = require('path')
const { build } = require('vite')

// lazy load babel since it's not used during dev
let babel
/**
 * @return {import('@babel/standalone')}
 */
const loadBabel = () => babel || (babel = require('@babel/standalone'))

// https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc
const safari10NoModuleFix = `!function(){var e=document,t=e.createElement("script");if(!("noModule"in t)&&"onbeforeload"in t){var n=!1;e.addEventListener("beforeload",(function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()}),!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove()}}();`

/**
 * @param {import('.').Options} options
 * @returns {import('vite').Plugin[]}
 */
function viteLegacyPlugin(options = {}) {
  /**
   * @type {import('vite').ResolvedConfig}
   */
  let config
  const targets = options.targets || 'defaults'
  const genLegacy = options.renderLegacyChunks !== false

  const debugFlag = process.env.DEBUG
  const isDebug = debugFlag === 'vite:*' || debugFlag === 'vite:legacy'

  const facadeToLegacyChunkMap = new Map()
  const facadeToLegacyPolyfillMap = new Map()
  const facadeToModernPolyfillMap = new Map()
  const modernPolyfills = new Set()
  const legacyPolyfills = new Set()

  if (Array.isArray(options.modernPolyfills)) {
    options.modernPolyfills.forEach((i) => {
      modernPolyfills.add(
        i.includes('/') ? `core-js/${i}` : `core-js/modules/${i}.js`
      )
    })
  }
  if (Array.isArray(options.polyfills)) {
    options.polyfills.forEach((i) => {
      if (i.startsWith(`regenerator`)) {
        legacyPolyfills.add(`regenerator-runtime/runtime.js`)
      } else {
        legacyPolyfills.add(
          i.includes('/') ? `core-js/${i}` : `core-js/modules/${i}.js`
        )
      }
    })
  }

  /**
   * @type {import('vite').Plugin}
   */
  const legacyGenerateBundlePlugin = {
    name: 'legacy-generate-polyfill-chunk',
    apply: 'build',

    async generateBundle(opts, bundle) {
      if (!isLegacyOutput(opts)) {
        if (!modernPolyfills.size) {
          return
        }
        isDebug &&
          console.log(
            `[@vitejs/plugin-legacy] modern polyfills:`,
            modernPolyfills
          )
        await buildPolyfillChunk(
          'polyfills-modern',
          modernPolyfills,
          bundle,
          facadeToModernPolyfillMap,
          config.build.minify
        )
        return
      }

      if (!genLegacy) {
        return
      }

      // legacy bundle
      if (legacyPolyfills.size) {
        if (!legacyPolyfills.has('es.promise')) {
          // check if the target needs Promise polyfill because SystemJS relies
          // on it
          detectPolyfills(`Promise.resolve()`, targets, legacyPolyfills)
        }

        isDebug &&
          console.log(
            `[@vitejs/plugin-legacy] legacy polyfills:`,
            legacyPolyfills
          )

        await buildPolyfillChunk(
          'polyfills-legacy',
          legacyPolyfills,
          bundle,
          facadeToLegacyPolyfillMap,
          // force using terser for legacy polyfill minification, since esbuild
          // isn't legacy-safe
          config.build.minify ? 'terser' : false
        )
      }
    }
  }

  /**
   * @type {import('vite').Plugin}
   */
  const legacyPostPlugin = {
    name: 'legacy-post-process',
    enforce: 'post',
    apply: 'build',

    configResolved(_config) {
      if (_config.build.lib) {
        throw new Error('@vitejs/plugin-legacy does not support library mode.')
      }
      config = _config

      if (!genLegacy) {
        return
      }

      /**
       * @param {import('rollup').OutputOptions} options
       * @returns {import('rollup').OutputOptions}
       */
      const createLegacyOutput = (options = {}) => {
        return {
          ...options,
          format: 'system',
          entryFileNames: path.posix.join(
            config.build.assetsDir,
            `[name]-legacy.[hash].js`
          ),
          chunkFileNames: path.posix.join(
            config.build.assetsDir,
            `[name]-legacy.[hash].js`
          )
        }
      }

      const { rollupOptions } = config.build
      const { output } = rollupOptions
      if (Array.isArray(output)) {
        rollupOptions.output = [...output.map(createLegacyOutput), ...output]
      } else {
        rollupOptions.output = [createLegacyOutput(output), output || {}]
      }
    },

    renderChunk(raw, chunk, opts) {
      if (!isLegacyOutput(opts)) {
        if (
          !options.modernPolyfills ||
          Array.isArray(options.modernPolyfills)
        ) {
          return null
        }
        // analyze and record modern polyfills
        detectPolyfills(raw, { esmodules: true }, modernPolyfills)
        return null
      }

      if (!genLegacy) {
        return
      }

      // @ts-ignore avoid esbuild transform on legacy chunks since it produces
      // legacy-unsafe code - e.g. rewriting object properties into shorthands
      opts.__vite_skip_esbuild__ = true

      const needPolyfills =
        options.polyfills !== false && !Array.isArray(options.polyfills)

      // transform the legacy chunk with @babel/preset-env
      const sourceMaps = !!config.build.sourcemap
      let { code, ast, map } = loadBabel().transform(raw, {
        ast: true,
        configFile: false,
        sourceMaps,
        inputSourceMap: sourceMaps && chunk.map,
        presets: [
          [
            'env',
            {
              targets,
              modules: false,
              bugfixes: true,
              loose: true,
              useBuiltIns: needPolyfills ? 'usage' : false,
              corejs: needPolyfills
                ? { version: 3, proposals: false }
                : undefined,
              shippedProposals: true,
              ignoreBrowserslistConfig: options.ignoreBrowserslistConfig
            }
          ]
        ]
      })

      if (needPolyfills) {
        // detect and remove polyfill imports. Since the legacy bundle uses
        // format: 'system', any import declarations are polyfill imports injected
        // by @babel/preset-env.
        for (const node of ast.program.body) {
          if (node.type === 'ImportDeclaration') {
            legacyPolyfills.add(node.source.value)
          }
        }
        // remove import declarations, perserve line positions so we don't need
        // to generate a source map again.
        code = code.replace(/^import ".*";/gm, '//')
      }

      return { code, map }
    },

    transformIndexHtml(html, { chunk }) {
      if (chunk.fileName.includes('-legacy')) {
        // The legacy bundle is built first, and its index.html isn't actually
        // emitted. Here we simply record its corresponding legacy chunk.
        facadeToLegacyChunkMap.set(chunk.facadeModuleId, chunk.fileName)
        return
      }

      /**
       * @type {import('vite').HtmlTagDescriptor[]}
       */
      const tags = []
      const htmlFilename = chunk.facadeModuleId.replace(/\?.*$/, '')

      // 1. inject modern polyfills
      const modernPolyfillFilename = facadeToModernPolyfillMap.get(
        chunk.facadeModuleId
      )
      if (modernPolyfillFilename) {
        tags.push({
          tag: 'script',
          attrs: {
            type: 'module',
            src: `${config.build.base}${modernPolyfillFilename}`
          }
        })
      } else if (modernPolyfills.size) {
        throw new Error(
          `No corresponding modern polyfill chunk found for ${htmlFilename}`
        )
      }

      if (!genLegacy) {
        return { html, tags }
      }

      // 2. inject Safari 10 nomodule fix
      tags.push({
        tag: 'script',
        attrs: { nomdoule: true },
        children: safari10NoModuleFix,
        injectTo: 'body'
      })

      // 3. inject legacy polyfills
      const legacyPolyfillFilename = facadeToLegacyPolyfillMap.get(
        chunk.facadeModuleId
      )
      if (legacyPolyfillFilename) {
        tags.push({
          tag: 'script',
          attrs: {
            nomodule: true,
            src: `${config.build.base}${legacyPolyfillFilename}`
          },
          injectTo: 'body'
        })
      } else if (legacyPolyfills.size) {
        throw new Error(
          `No corresponding legacy polyfill chunk found for ${htmlFilename}`
        )
      }

      // 4. inject legacy entry
      const legacyEntryFilename = facadeToLegacyChunkMap.get(
        chunk.facadeModuleId
      )
      if (legacyEntryFilename) {
        tags.push({
          tag: 'script',
          attrs: { nomodule: true },
          children: `System.import("${config.build.base}${legacyEntryFilename}")`,
          injectTo: 'body'
        })
      } else {
        throw new Error(
          `No corresponding legacy entry chunk found for ${htmlFilename}`
        )
      }

      return {
        html,
        tags
      }
    },

    generateBundle(opts, bundle) {
      if (isLegacyOutput(opts)) {
        // avoid emitting duplicate assets
        for (const name in bundle) {
          if (bundle[name].type === 'asset') {
            delete bundle[name]
          }
        }
      }
    }
  }

  return [legacyGenerateBundlePlugin, legacyPostPlugin]
}

/**
 * @param {string} code
 * @param {any} targets
 * @param {Set<string>} list
 */
function detectPolyfills(code, targets, list) {
  const { ast } = loadBabel().transform(code, {
    ast: true,
    configFile: false,
    presets: [
      [
        'env',
        {
          targets,
          modules: false,
          useBuiltIns: 'usage',
          corejs: { version: 3, proposals: false },
          shippedProposals: true,
          ignoreBrowserslistConfig: true
        }
      ]
    ]
  })
  for (const node of ast.program.body) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value
      if (
        source.startsWith('core-js/') ||
        source.startsWith('regenerator-runtime/')
      ) {
        list.add(source)
      }
    }
  }
}

/**
 * @param {string} name
 * @param {Set<string>} imports
 * @param {import('rollup').OutputBundle} bundle
 * @param {Map<string, string>} facadeToChunkMap
 * @param {import('vite').BuildOptions['minify']} minify
 */
async function buildPolyfillChunk(
  name,
  imports,
  bundle,
  facadeToChunkMap,
  minify
) {
  const res = await build({
    // so that everything is resolved from here
    root: __dirname,
    configFile: false,
    logLevel: 'error',
    plugins: [polyfillsPlugin(imports)],
    build: {
      write: false,
      target: false,
      minify,
      rollupOptions: {
        input: {
          [name]: polyfillId
        },
        output: {
          format: name.includes('legacy') ? 'iife' : 'es'
        }
      }
    }
  })
  const polyfillChunk = (Array.isArray(res) ? res[0] : res).output[0]

  // associate the polyfill chunk to every entry chunk so that we can retrieve
  // the polyfill filename in index html transform
  for (const key in bundle) {
    const chunk = bundle[key]
    if (chunk.type === 'chunk' && chunk.facadeModuleId) {
      facadeToChunkMap.set(chunk.facadeModuleId, polyfillChunk.fileName)
    }
  }

  // add the chunk to the bundle
  bundle[polyfillChunk.name] = polyfillChunk
}

const polyfillId = 'vite/legacy-polyfills'

/**
 * @param {Set<string>} imports
 * @return {import('rollup').Plugin}
 */
function polyfillsPlugin(imports) {
  return {
    name: 'polyfills',
    resolveId(id) {
      if (id === polyfillId) {
        return id
      }
    },
    load(id) {
      if (id === polyfillId) {
        return (
          [...imports].map((i) => `import "${i}";`).join('') +
          `import "systemjs/dist/s.min.js";`
        )
      }
    }
  }
}

/**
 * @param {import('rollup').NormalizedOutputOptions} options
 */
function isLegacyOutput(options) {
  return (
    options.format === 'system' &&
    typeof options.entryFileNames === 'string' &&
    options.entryFileNames.includes('-legacy')
  )
}

module.exports = viteLegacyPlugin
viteLegacyPlugin.default = viteLegacyPlugin
