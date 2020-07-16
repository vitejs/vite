<template>
  <h1>Vite Playground</h1>
  <TestEnv />
  <h2>Async Component</h2>
  <TestAsync />
  <TestModuleResolve />
  <TestHmr />
  <TestPostCss />
  <TestScopedCss />
  <TestCssModules />
  <TestCssAtImport />
  <TestPreprocessors />
  <TestAssets />
  <TestSrcImport />
  <TestJsonImport />
  <TestTs />
  <TestJsx />
  <TestAlias />
  <TestTransform />
  <TestRewriteOptimized />
  <TestCustomBlocks />
  <TestOptimizeLink />
  <TestRewriteUnoptimized />
  <TestNormalizePublicPath />
  <TestDynamicImport />
  <TestWebWorker />
  <Suspense>
    <TestWasm />
  </Suspense>
  <TestScriptSetupStyleVars msg="Test message" />
</template>

<script>
import { defineAsyncComponent } from 'vue'
import TestEnv from './TestEnv.vue'
import TestHmr from './hmr/TestHmr.vue'
import TestPostCss from './css/TestPostCss.vue'
import TestScopedCss from './css/TestScopedCss.vue'
import TestCssModules from './css/TestCssModules.vue'
import TestPreprocessors from './TestPreprocessors.vue'
import TestSrcImport from './src-import/TestBlockSrcImport.vue'
import TestAssets from './test-assets/TestAssets.vue'
import TestJsonImport from './json/TestJsonImport.vue'
import TestTs from './ts/TestTs.vue'
import TestJsx from './jsx/TestJsx.vue'
import TestAlias from './alias/TestAlias.vue'
import TestTransform from './transform/TestTransform.vue'
import TestCssAtImport from './css-@import/TestCssAtImport.vue'
import TestCustomBlocks from './custom-blocks/TestCustomBlocks.vue'
import TestOptimizeLink from './optimize-linked/TestOptimizeLink.vue'
import TestModuleResolve from './resolve/TestModuleResolve.vue'
import TestNormalizePublicPath from './resolve/TestNormalizePublicPath.vue'
import TestRewriteUnoptimized from './resolve/rewrite-unoptimized/TestRewriteUnoptimized.vue'
import TestRewriteOptimized from './resolve/rewrite-optimized/TestRewriteOptimized.vue'
import TestDynamicImport from './dynamic-import/TestDynamicImport.vue'
import TestWebWorker from './worker/TestWorker.vue'
import TestWasm from './wasm/TestWasm.vue'
import TestScriptSetupStyleVars from './script-setup/TestScriptSetupStyleVars.vue'

export default {
  components: {
    TestEnv,
    TestModuleResolve,
    TestHmr,
    TestPostCss,
    TestScopedCss,
    TestCssModules,
    TestPreprocessors,
    TestCssAtImport,
    TestSrcImport,
    TestAssets,
    TestJsonImport,
    TestTs,
    TestJsx,
    TestAlias,
    TestTransform,
    TestAsync: defineAsyncComponent(() => import('./TestAsync.vue')),
    TestRewriteOptimized,
    TestCustomBlocks,
    TestOptimizeLink,
    TestRewriteUnoptimized,
    TestNormalizePublicPath,
    TestDynamicImport,
    TestWebWorker,
    TestWasm,
    TestScriptSetupStyleVars
  }
}
</script>
