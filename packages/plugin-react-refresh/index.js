// @ts-check
const fs = require('fs')

const runtimePublicPath = '/@react-refresh'
const runtimeFilePath = require.resolve(
  'react-refresh/cjs/react-refresh-runtime.development.js'
)

function debounce(fn, delay) {
  let handle
  return () => {
    clearTimeout(handle)
    handle = setTimeout(fn, delay)
  }
}

const runtimeCode = `
const exports = {}
${fs.readFileSync(runtimeFilePath, 'utf-8')}
${debounce.toString()}
exports.performReactRefresh = debounce(exports.performReactRefresh, 16)
export default exports
`

/**
 * @type { import('vite').Plugin }
 */
const resolve = {
  name: 'react-refresh-resolve',
  resolveId(id) {
    // TODO we don't need this when optimizer is in place
    if (id === 'react') {
      return this.resolve('@pika/react/source.development.js')
    }
    if (id === 'react-dom') {
      return this.resolve('@pika/react-dom/source.development.js')
    }
    if (id === runtimePublicPath) {
      return runtimeFilePath
    }
  },

  load(id) {
    if (id === runtimeFilePath) {
      return runtimeCode
    }
  }
}

/**
 * @type { import('vite').Plugin }
 */
const transform = {
  name: 'react-refresh-transform',

  // make sure this is applied after vite's internal esbuild transform
  // which handles (j|t)sx
  enforce: 'post',

  transform(code, id) {
    if (
      // @ts-ignore
      !this.serverContext ||
      // @ts-ignore
      this.serverContext.config.mode === 'production'
    ) {
      return
    }

    if (!/\.(t|j)sx?$/.test(id) || id.includes('node_modules')) {
      return
    }

    // plain js files can't use React without importing it
    if (id.endsWith('.js') && !code.includes('react')) {
      return
    }

    const isReasonReact = id.endsWith('.bs.js')
    const result = require('@babel/core').transformSync(code, {
      plugins: [
        require('@babel/plugin-syntax-import-meta'),
        require('react-refresh/babel')
      ],
      ast: !isReasonReact,
      sourceMaps: true,
      sourceFileName: id
    })

    if (!/\$RefreshReg\$\(/.test(result.code)) {
      // no component detected in the file
      return code
    }

    const header = `
  import RefreshRuntime from "${runtimePublicPath}";

  let prevRefreshReg;
  let prevRefreshSig;

  if (!window.__vite_plugin_react_preamble_installed__) {
    throw new Error(
      "vite-plugin-react can't detect preamble. Something is wrong. See https://github.com/vitejs/vite-plugin-react/pull/11#discussion_r430879201"
    );
  }

  if (import.meta.hot) {
    prevRefreshReg = window.$RefreshReg$;
    prevRefreshSig = window.$RefreshSig$;
    window.$RefreshReg$ = (type, id) => {
      RefreshRuntime.register(type, ${JSON.stringify(id)} + " " + id)
    };
    window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
  }`.replace(/[\n]+/gm, '')

    const footer = `
  if (import.meta.hot) {
    window.$RefreshReg$ = prevRefreshReg;
    window.$RefreshSig$ = prevRefreshSig;

    ${
      isReasonReact || isRefreshBoundary(result.ast)
        ? `import.meta.hot.accept();`
        : ``
    }
    if (!window.__vite_plugin_react_timeout) {
      window.__vite_plugin_react_timeout = setTimeout(() => {
        window.__vite_plugin_react_timeout = 0;
        RefreshRuntime.performReactRefresh();
      }, 30);
    }
  }`

    return {
      code: `${header}${result.code}${footer}`,
      map: result.map
    }
  },

  transformIndexHtml() {
    return [
      {
        tag: 'script',
        attrs: { type: 'module' },
        children: `
  import RefreshRuntime from "${runtimePublicPath}"
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
        `
      }
    ]
  }
}

/**
 * @param {import('@babel/types').File} ast
 */
function isRefreshBoundary(ast) {
  // Every export must be a React component.
  return ast.program.body.every((node) => {
    if (node.type !== 'ExportNamedDeclaration') {
      return true
    }
    const { declaration, specifiers } = node
    if (declaration && declaration.type === 'VariableDeclaration') {
      return declaration.declarations.every(
        ({ id }) => id.type === 'Identifier' && isComponentishName(id.name)
      )
    }
    return specifiers.every(
      ({ exported }) =>
        exported.type === 'Identifier' && isComponentishName(exported.name)
    )
  })
}

/**
 * @param {string} name
 */
function isComponentishName(name) {
  return typeof name === 'string' && name[0] >= 'A' && name[0] <= 'Z'
}

module.exports = [resolve, transform]
