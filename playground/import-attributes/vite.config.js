import { defineConfig } from 'vite'
import { dataToEsm } from '@rollup/pluginutils'

export default defineConfig({
  plugins: [
    {
      name: 'attribute-transform',
      transform(code, id) {
        const { attributes } = this.getModuleInfo(id)
        if (attributes.type === 'json') {
          const parsed = JSON.parse(code)
          return {
            code: dataToEsm(parsed),
            map: { mappings: '' },
          }
        }
      },
    },
  ],
})
