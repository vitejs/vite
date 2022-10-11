import { resolve } from 'node:path'
import { array } from '../siblings/foo'

export default {
  array,
  build: {
    rollupOptions: {
      plugins: []
    },

    rollupConfigFile: resolve(__dirname, './rollup.config.ts')
  }
}
