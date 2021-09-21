// extend the descriptor so we can store the scopeId on it
declare module '@vue/compiler-sfc' {
  interface SFCDescriptor {
    id: string
  }
}

import * as _compiler from '@vue/compiler-sfc'

export let compiler: typeof _compiler

try {
  // Vue 3.2.13+ ships the SFC compiler directly under the `vue` package
  // making it no longer necessary to have @vue/compiler-sfc separately installed.
  compiler = require('vue/compiler-sfc')
} catch (e) {
  try {
    compiler = require('@vue/compiler-sfc')
  } catch (e) {
    throw new Error(
      `@vitejs/plugin-vue requires vue (>=3.2.13) or @vue/compiler-sfc ` +
        `to be present in the dependency tree.`
    )
  }
}
