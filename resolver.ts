import { Resolver } from 'vite'

export const resolver: Resolver = {
  alias(id) {
    if (id === 'vue') {
      return 'vue/dist/vue.runtime.esm.js'
    }
  },
}
