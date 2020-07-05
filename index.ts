import { resolver } from './resolver'
import { vuePlugin } from './serverPlugin'

export = {
  resolvers: [resolver],
  configureServer: vuePlugin,
  rollupInputOptions: {
    plugins: [require('rollup-plugin-vue')({})],
  },
}
