const { legacyEnvVarMarker } = require('./constants.js')

// lazy load swc since it's not used during dev
let swc
/**
 * @return {import('@swc/core')}
 */
const loadSWC = () => swc || (swc = require('@swc/core'))

/**
 * @param {string} code
 * @param {any} targets
 * @param {Set<string>} list
 */
module.exports.detectPolyfills = function detectPolyfills(code, targets, list) {
  const swc = loadSWC()
  const result = swc.transformSync(code, {
    swcrc: false,
    configFile: false,

    env: {
      targets,
      mode: 'usage',
      coreJs: '3',
      shippedProposals: true
    }
  })

  swc.transformSync(result.code, {
    plugin(program) {
      for (const node of program.body) {
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

      return program
    }
  })
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
 * @returns {import('@swc/core').Output}
 */
module.exports.transformChunk = function transformChunk(raw, options) {
  const swc = loadSWC()

  const initialResult = swc.transformSync(raw, {
    swcrc: false,
    configFile: false,
    sourceMaps: options.sourceMaps,
    inputSourceMap: options.inputSourceMap,
    env: {
      targets: options.ignoreBrowserslistConfig ? options.targets : undefined,
      loose: false,
      mode: options.needPolyfills ? 'usage' : false,
      coreJs: options.legacyPolyfills ? '3' : undefined,
      shippedProposals: true
    },
    jsc: {
      transform: {
        optimizer: {
          globals: {
            vars: { [legacyEnvVarMarker]: 'true' }
          }
        }
      }
    }
  })

  const normalizedResult = swc.transformSync(initialResult.code, {
    swcrc: false,
    configFile: false,
    sourceMaps: !!initialResult.map,
    inputSourceMap: initialResult.map,
    plugin: transformChunkPlugin(options.legacyPolyfills)
  })

  return {
    code: normalizedResult.code,
    map: !normalizedResult.map ? undefined : JSON.parse(normalizedResult.map)
  }
}

/**
 * @param {Set<string>} polyfills
 * @returns {import('@swc/core').Plugin}
 */
function transformChunkPlugin(polyfills) {
  return (program) => {
    program.body = program.body.filter((node) => {
      if (node.type === 'ImportDeclaration') {
        polyfills.add(node.source.value)
        return false
      }

      if (node.type === 'VariableDeclaration') {
        node.declarations = node.declarations.filter((declaration) => {
          if (
            declaration.init &&
            declaration.init.type === 'CallExpression' &&
            declaration.init.callee.value === 'require'
          ) {
            polyfills.add(declaration.init.arguments[0].expression.value)
            return false
          }

          return true
        })

        if (node.declarations.length === 0) {
          return false
        }
      }

      return true
    })

    program.body = [
      {
        type: 'ExpressionStatement',
        span: { start: 0, end: 0, ctxt: 0 },

        expression: {
          type: 'CallExpression',
          span: { start: 0, end: 0, ctxt: 0 },

          callee: {
            type: 'FunctionExpression',
            span: { start: 0, end: 0, ctxt: 0 },

            id: null,
            params: [],

            async: false,
            generator: false,

            body: {
              stmts: program.body,
              type: 'BlockStatement',
              span: { start: 0, end: 0, ctxt: 0 }
            }
          }
        }
      }
    ]

    return program
  }
}
