import { resolver } from './resolver'
import { vuePlugin } from './serverPlugin'

export = {
  resolvers: [resolver],
  configureServer: vuePlugin,
  enableRollupPluginVue: false,
  rollupInputOptions: {
    plugins: [require('rollup-plugin-vue')({})],
  },
}
