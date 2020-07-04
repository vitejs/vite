import { Resolver } from 'vite'

export const resolver: Resolver = {
  alias(id) {
    const isProd = process.env.NODE_ENV === 'production'
    if (id === 'vue') {
      return isProd ? 'vue/dist/vue.runtime.common.js' : 'vue/dist/vue.runtime.esm.js'
    }
  }
}
