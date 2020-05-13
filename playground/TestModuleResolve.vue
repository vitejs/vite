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
</template>

<script>
import { createRouter } from 'vue-router'
import { createStore } from 'vuex'
import { add } from 'lodash-es'
import { foo } from './util'

export default {
  setup() {
    return {
      router: typeof createRouter === 'function' ? 'ok' : 'error',
      store: typeof createStore === 'function' ? 'ok' : 'error',
      optResolve: typeof add === 'function' ? 'ok' : 'error',
      indexResolve: foo() ? 'ok' : 'error'
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
