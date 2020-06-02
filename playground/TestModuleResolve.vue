<template>
  <h2>Module Resolving</h2>
  <div class="module-resolve-router" :class="router">
    vue-router@next {{ router }}
  </div>
  <div class="module-resolve-store" :class="store">vuex@next {{ store }}</div>
  <div class="module-resolve-optimize" :class="optResolve">
    optimized {{ optResolve }}
  </div>
  <div class="index-resolve" :class="indexResolve">
    directory index resolve: {{ indexResolve }}
  </div>
  <div class="dot-resolve" :class="dotResolve">
    filename with dot resolve: {{ dotResolve }}
  </div>
  <div class="browser-field-resolve" :class="browserFieldResolve">
    resolve browser field in package.json: {{ browserFieldResolve }}
  </div>
  <div class="css-entry-resolve" :class="cssEntry">
    resolve dep w/ css entry point: {{ cssEntry }}
  </div>
</template>

<script>
import { createRouter } from 'vue-router'
import { createStore } from 'vuex'
import { add } from 'lodash-es'
import { foo } from './util'
import { bar } from './util/bar.util'
import value from 'resolve-browser-field-test-package'
import css from 'normalize.css'

export default {
  setup() {
    return {
      router: typeof createRouter === 'function' ? 'ok' : 'error',
      store: typeof createStore === 'function' ? 'ok' : 'error',
      optResolve: typeof add === 'function' ? 'ok' : 'error',
      indexResolve: foo() ? 'ok' : 'error',
      dotResolve: bar() ? 'ok' : 'error',
      browserFieldResolve: value === 'success' ? 'ok' : 'error',
      cssEntry: typeof css === 'string' ? 'ok' : 'error'
    }
  }
}
</script>

<style scoped>
.ok {
  color: green;
}
.error {
  color: red;
}
</style>
