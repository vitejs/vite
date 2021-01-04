// @ts-check
const babel = require('@babel/core')
const jsx = require('@vue/babel-plugin-jsx')
const importMeta = require('@babel/plugin-syntax-import-meta')
const hash = require('hash-sum')

/**
 * @param {import('.').Options} options
 * @returns {import('vite').Plugin}
 */
module.exports = function vueJsxPlugin(options = {}) {
  let needHmr = false

  return {
    name: 'vue-jsx',

    config(config) {
      return {
        // only apply esbuild to ts files
        // since we are handling jsx and tsx now
        esbuild: {
          include: /\.ts$/
        },
        define: {
          __VUE_OPTIONS_API__: true,
          __VUE_PROD_DEVTOOLS__: false,
          ...config.define
        }
      }
    },

    configResolved(config) {
      needHmr = config.command === 'serve' && !config.isProduction
    },

    transform(code, id) {
      if (/\.[jt]sx$/.test(id)) {
        const plugins = [importMeta, [jsx, options]]
        if (id.endsWith('.tsx')) {
          plugins.push([
            require('@babel/plugin-transform-typescript'),
            // @ts-ignore
            { isTSX: true, allowExtensions: true }
          ])
        }

        const result = babel.transformSync(code, {
          ast: true,
          plugins,
          sourceMaps: true,
          sourceFileName: id
        })

        if (!needHmr) {
          return {
            code: result.code,
            map: result.map
          }
        }

        // check for hmr injection
        /**
         * @type {{ name: string, hash: string }[]}
         */
        const declaredComponents = []
        /**
         * @type {{
         *  local: string,
         *  exported: string,
         *  id: string,
         *  hash: string
         * }[]}
         */
        const hotComponents = []
        let hasDefault = false

        for (const node of result.ast.program.body) {
          if (node.type === 'VariableDeclaration') {
            const names = parseComponentDecls(node, code)
            if (names.length) {
              declaredComponents.push(...names)
            }
          }

          if (node.type === 'ExportNamedDeclaration') {
            if (
              node.declaration &&
              node.declaration.type === 'VariableDeclaration'
            ) {
              hotComponents.push(
                ...parseComponentDecls(node.declaration, code).map(
                  ({ name, hash: _hash }) => ({
                    local: name,
                    exported: name,
                    id: hash(id + name),
                    hash: _hash
                  })
                )
              )
            } else if (node.specifiers.length) {
              for (const spec of node.specifiers) {
                if (
                  spec.type === 'ExportSpecifier' &&
                  spec.exported.type === 'Identifier'
                ) {
                  const matched = declaredComponents.find(
                    ({ name }) => name === spec.local.name
                  )
                  if (matched) {
                    hotComponents.push({
                      local: spec.local.name,
                      exported: spec.exported.name,
                      id: hash(id + spec.exported.name),
                      hash: matched.hash
                    })
                  }
                }
              }
            }
          }

          if (node.type === 'ExportDefaultDeclaration') {
            if (node.declaration.type === 'Identifier') {
              const _name = node.declaration.name
              const matched = declaredComponents.find(
                ({ name }) => name === _name
              )
              if (matched) {
                hotComponents.push({
                  local: node.declaration.name,
                  exported: 'default',
                  id: hash(id + 'default'),
                  hash: matched.hash
                })
              }
            } else if (isDefineComponentCall(node.declaration)) {
              hasDefault = true
              hotComponents.push({
                local: '__default__',
                exported: 'default',
                id: hash(id + 'default'),
                hash: hash(
                  code.slice(node.declaration.start, node.declaration.end)
                )
              })
            }
          }
        }

        if (hotComponents.length) {
          let code = result.code
          if (hasDefault) {
            code =
              code.replace(
                /export default defineComponent/g,
                `const __default__ = defineComponent`
              ) + `\nexport default __default__`
          }

          let callbackCode = ``
          for (const { local, exported, id, hash } of hotComponents) {
            code +=
              `\n${local}.__hmrId = "${id}"` +
              `\n${local}.__hmrHash = "${hash}"` +
              `\n__VUE_HMR_RUNTIME__.createRecord("${id}", ${local})`
            callbackCode +=
              `\n  if (__${exported}.__hmrHash !== ${local}.__hmrHash) ` +
              `__VUE_HMR_RUNTIME__.reload("${id}", __${exported})`
          }

          code += `\nimport.meta.hot.accept(({${hotComponents
            .map((c) => `${c.exported}: __${c.exported}`)
            .join(',')}}) => {${callbackCode}\n})`

          result.code = code
        }

        return {
          code: result.code,
          map: result.map
        }
      }
    }
  }
}

/**
 * @param {import('@babel/core').types.VariableDeclaration} node
 * @param {string} source
 */
function parseComponentDecls(node, source) {
  const names = []
  for (const decl of node.declarations) {
    if (decl.id.type === 'Identifier' && isDefineComponentCall(decl.init)) {
      names.push({
        name: decl.id.name,
        hash: hash(source.slice(decl.init.start, decl.init.end))
      })
    }
  }
  return names
}

/**
 * @param {import('@babel/core').types.Node} node
 */
function isDefineComponentCall(node) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'defineComponent'
  )
}
