import { resolver } from './resolver'
import { vuePlugin } from './serverPlugin'

export = function createVuePlugin(options = {}) {
  return {
    resolvers: [resolver],
    configureServer: vuePlugin,
    enableRollupPluginVue: false,
    rollupInputOptions: {
      plugins: [require('rollup-plugin-vue')({})],
    },
  }
}
