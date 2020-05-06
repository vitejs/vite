<template>
  <h1>Vite Playground <code>__DEV__</code></h1>
  <TestModuleResolve />
  <TestHmr />
  <TestPostCss />
  <TestScopedCss />
  <TestCssModules />
  <TestPreprocessors />
  <TestAssets />
  <TestJsonImport />
  <TestJsx />
  <h2>Async Component</h2>
  <TestAsync />
</template>

<script>
import { defineAsyncComponent } from "vue";
import TestModuleResolve from "./TestModuleResolve.vue";
import TestHmr from "./TestHmr.vue";
import TestPostCss from "./TestPostCss.vue";
import TestScopedCss from "./TestScopedCss.vue";
import TestCssModules from "./TestCssModules.vue";
import TestPreprocessors from "./TestPreprocessors.vue";
import TestAssets from "./TestAssets.vue";
import TestJsonImport from "./TestJsonImport.vue";
import TestJsx from "./TestJsx.vue";

export default {
  components: {
    TestModuleResolve,
    TestHmr,
    TestPostCss,
    TestScopedCss,
    TestCssModules,
    TestPreprocessors,
    TestAssets,
    TestJsonImport,
    TestJsx,
    TestAsync: defineAsyncComponent(() => import("./TestAsync.vue")),
  },
};
</script>
