const { legacyEnvVarMarker } = require('./constants.js')

// lazy load babel since it's not used during dev
let babel
/**
 * @return {import('@babel/standalone')}
 */
const loadBabel = () => babel || (babel = require('@babel/standalone'))

/**
 * @param {string} code
 * @param {any} targets
 * @param {Set<string>} list
 */
module.exports.detectPolyfills = function detectPolyfills(code, targets, list) {
  const { ast } = loadBabel().transform(code, {
    ast: true,
    babelrc: false,
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
 * @typedef {object} TransformChunkOptions
 * @property {boolean} sourceMaps
 * @property {boolean} needPolyfills
 * @property {Set<string>} legacyPolyfills
 * @property {import('rollup').SourceMap} inputSourceMap
 * @property {import('.').Options['targets']} targets
 * @property {import('.').Options['ignoreBrowserslistConfig']} ignoreBrowserslistConfig
 */

/**
 * @param {string} raw
 * @param {TransformChunkOptions} options
 * @returns {*}
 */
module.exports.transformChunk = function transformChunk(raw, options) {
  return loadBabel().transform(raw, {
    babelrc: false,
    configFile: false,
    compact: true,
    sourceMaps: options.sourceMaps,
    inputSourceMap: options.inputSourceMap,
    presets: [
      // forcing our plugin to run before preset-env by wrapping it in a
      // preset so we can catch the injected import statements...
      [
        () => ({
          plugins: [
            recordAndRemovePolyfillBabelPlugin(options.legacyPolyfills),
            replaceLegacyEnvBabelPlugin(),
            wrapIIFEBabelPlugin()
          ]
        })
      ],
      [
        'env',
        {
          targets: options.targets,
          modules: false,
          bugfixes: true,
          loose: false,
          useBuiltIns: options.needPolyfills ? 'usage' : false,
          corejs: options.legacyPolyfills
            ? { version: 3, proposals: false }
            : undefined,
          shippedProposals: true,
          ignoreBrowserslistConfig: options.ignoreBrowserslistConfig
        }
      ]
    ]
  })
}

/**
 * @param {Set<string>} polyfills
 */
function recordAndRemovePolyfillBabelPlugin(polyfills) {
  return ({ types: t }) => ({
    name: 'vite-remove-polyfill-import',
    post({ path }) {
      path.get('body').forEach((p) => {
        if (t.isImportDeclaration(p)) {
          polyfills.add(p.node.source.value)
          p.remove()
        }
      })
    }
  })
}

function replaceLegacyEnvBabelPlugin() {
  return ({ types: t }) => ({
    name: 'vite-replace-env-legacy',
    visitor: {
      Identifier(path) {
        if (path.node.name === legacyEnvVarMarker) {
          path.replaceWith(t.booleanLiteral(true))
        }
      }
    }
  })
}

function wrapIIFEBabelPlugin() {
  return ({ types: t, template }) => {
    const buildIIFE = template(';(function(){%%body%%})();')

    return {
      name: 'vite-wrap-iife',
      post({ path }) {
        if (!this.isWrapped) {
          this.isWrapped = true
          path.replaceWith(t.program(buildIIFE({ body: path.node.body })))
        }
      }
    }
  }
}
