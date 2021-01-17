import babel = require('@babel/core')
import jsx = require('@vue/babel-plugin-jsx')
import importMeta = require('@babel/plugin-syntax-import-meta')
import hash = require('hash-sum')
import { Plugin } from 'vite'
import traverse from '@babel/traverse'
import t = require('@babel/types')
import { isDefineComponentCall, parseComponentDecls } from './utils'

export default function vueJsxPlugin(
  options: jsx.VueJSXPluginOptions = {}
): Plugin {
  let needHmr = false
  let needSourceMap = true

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
      needSourceMap = config.command === 'serve' || !!config.build.sourcemap
    },

    transform(code, id) {
      if (/\.[jt]sx$/.test(id)) {
        const plugins = [importMeta, [jsx, options]]
        if (id.endsWith('.tsx')) {
          plugins.push([
            require('@babel/plugin-transform-typescript'),
            { isTSX: true, allowExtensions: true }
          ])
        }

        const result = babel.transformSync(code, {
          ast: true,
          plugins,
          sourceMaps: needSourceMap,
          sourceFileName: id
        })

        if (!result) {
          return {
            code: '',
            map: ''
          }
        }

        if (!needHmr) {
          return {
            code: result.code!,
            map: result.map!
          }
        }

        // check for hmr injection
        const declaredComponents: { name: string }[] = []
        const hotComponents: {
          local: string
          exported: string
          id: string
        }[] = []
        let hasDefault = false

        traverse(result.ast, {
          VariableDeclaration({ node }) {
            const names = parseComponentDecls(node)
            if (names.length) {
              declaredComponents.push(...names)
            }
          },
          ExportNamedDeclaration({ node }) {
            if (node.declaration && t.isVariableDeclaration(node.declaration)) {
              hotComponents.push(
                ...parseComponentDecls(node.declaration).map(({ name }) => ({
                  local: name,
                  exported: name,
                  id: hash(id + name)
                }))
              )
            } else if (node.specifiers.length) {
              for (const spec of node.specifiers) {
                if (
                  t.isExportSpecifier(spec) &&
                  t.isIdentifier(spec.exported)
                ) {
                  const matched = declaredComponents.find(
                    ({ name }) => name === spec.local.name
                  )
                  if (matched) {
                    hotComponents.push({
                      local: spec.local.name,
                      exported: spec.exported.name,
                      id: hash(id + spec.exported.name)
                    })
                  }
                }
              }
            }
          },
          ExportDefaultDeclaration(nodePath) {
            const { node } = nodePath
            if (t.isIdentifier(node.declaration)) {
              const _name = node.declaration.name
              const matched = declaredComponents.find(
                ({ name }) => name === _name
              )
              if (matched) {
                hotComponents.push({
                  local: node.declaration.name,
                  exported: 'default',
                  id: hash(id + 'default')
                })
              }
            } else if (isDefineComponentCall(node.declaration)) {
              hasDefault = true
              hotComponents.push({
                local: '__default__',
                exported: 'default',
                id: hash(id + 'default')
              })
            }
          }
        })

        if (hotComponents.length) {
          let code = result.code!
          if (hasDefault) {
            code =
              code.replace(
                /export default defineComponent/g,
                `const __default__ = defineComponent`
              ) + `\nexport default __default__`
          }

          let callbackCode = ``
          for (const { local, exported, id } of hotComponents) {
            code +=
              `\n${local}.__hmrId = "${id}"` +
              `\n__VUE_HMR_RUNTIME__.createRecord("${id}", ${local})`
            callbackCode += `\n__VUE_HMR_RUNTIME__.reload("${id}", __${exported})`
          }

          code += `\nimport.meta.hot.accept(({${hotComponents
            .map((c) => `${c.exported}: __${c.exported}`)
            .join(',')}}) => {${callbackCode}\n})`

          result.code = code
        }

        return {
          code: result.code!,
          map: result.map!
        }
      }
    }
  }
}

module.exports = vueJsxPlugin
vueJsxPlugin['default'] = vueJsxPlugin
