<template>
  <h1>Vite Playground</h1>
  <p class="dev">
    <code>__DEV__: {{ dev }}</code>
  </p>
  <p class="node_env">
    <code>process.env.NODE_ENV: {{ env }}</code>
  </p>
  <TestModuleResolve />
  <TestHmr />
  <TestPostCss />
  <TestScopedCss />
  <TestCssModules />
  <TestPreprocessors />
  <TestAssets />
  <TestSrcImport/>
  <TestJsonImport />
  <TestTs />
  <TestJsx />
  <h2>Async Component</h2>
  <TestAsync />
</template>

<script>
import { defineAsyncComponent } from 'vue'
import TestModuleResolve from './TestModuleResolve.vue'
import TestHmr from './TestHmr.vue'
import TestPostCss from './TestPostCss.vue'
import TestScopedCss from './TestScopedCss.vue'
import TestCssModules from './TestCssModules.vue'
import TestPreprocessors from './TestPreprocessors.vue'
import TestSrcImport from './src-import/TestBlockSrcImport.vue'
import TestAssets from './TestAssets.vue'
import TestJsonImport from './TestJsonImport.vue'
import TestTs from './ts/TestTs.vue'
import TestJsx from './TestJsx.vue'

export default {
  data: () => ({
    dev: __DEV__,
    env: process.env.NODE_ENV
  }),
  components: {
    TestModuleResolve,
    TestHmr,
    TestPostCss,
    TestScopedCss,
    TestCssModules,
    TestPreprocessors,
    TestSrcImport,
    TestAssets,
    TestJsonImport,
    TestTs,
    TestJsx,
    TestAsync: defineAsyncComponent(() => import('./TestAsync.vue'))
  }
}
</script>
