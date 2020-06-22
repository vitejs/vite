<template>
  <h2>Hot Module Replacement</h2>
  <p>
    <span>
      HMR: click button and edit template part of <code>./TestHmr.vue</code>,
      count should not reset
    </span>
    <button class="hmr-increment" @click="count++">
      &gt;&gt;&gt; {{ count }} &lt;&lt;&lt;
    </button>
  </p>
  <p>
    <span>
      HMR: edit the return value of <code>foo()</code> in
      <code>./testHmrPropagation.js</code>, should update without reloading
      page:
    </span>
    <span class="hmr-propagation">{{ foo() }}</span>
  </p>
  <p>
    <span>
      HMR: edit the value of <code>bar</code> in
      <code>./testDynamicImportHmrPropagation.js</code>, should update without
      reloading page:
    </span>
    <span class="hmr-propagation-dynamic">{{ barValue }}</span>
    <button class="hmr-propagation-dynamic-load" @click="loadDynamic()">
      load
    </button>
  </p>
  <p>
    <span>
      HMR: edit the value of <code>baz</code> in
      <code>./testFullDynamicImportHmrPropagation.js</code>, the app should not
      update because the imported module is not self-accepting:
    </span>
    <span class="hmr-propagation-full-dynamic">{{ bazValue }}</span>
    <button
      class="hmr-propagation-full-dynamic-load"
      @click="loadFullDynamic()"
    >
      load
    </button>
  </p>
  <p>
    <span>
      HMR: edit the value of <code>__text</code> in
      <code>./testFullDynamicImportHmrPropagationSelfAccepting.js</code>, the
      app should update without reloading and the count state should persist,
      because the imported module is self-accepting:
    </span>
    <span
      class="hmr-propagation-full-dynamic-self-accepting"
      ref="dynamicDataOutlet"
      >qux not loaded</span>
    <button
      class="hmr-propagation-full-dynamic-load-self-accepting"
      @click="loadFullDynamicSelfAccepting()"
    >
      load
    </button>
  </p>
  <p>
    HMR: manual API (see console) - edit <code>./testHmrManual.js</code> and it
    should log new exported value without reloading the page.
  </p>
</template>

<script>
import { ref } from 'vue'
import { foo } from './testHmrPropagation'

export default {
  setup() {
    const barValue = ref('bar not loaded')
    const bazValue = ref('baz not loaded')
    const dynamicDataOutlet = ref()
    return {
      count: 0,
      foo,
      barValue,
      bazValue,
      dynamicDataOutlet,
      loadDynamic() {
        barValue.value = 'bar loading'
        // This kind of dynamic import can be analyzed and rewrited by vite
        import('./testHmrPropagationDynamicImport').then(({ bar }) => {
          barValue.value = bar
        })
      },
      loadFullDynamic() {
        bazValue.value = 'baz loading'
        // This kind of dynamic import can't be analyzed and rewrited by vite
        import(dummy('./testHmrPropagationFullDynamicImport')).then(
          ({ baz }) => {
            bazValue.value = baz
          }
        )
      },
      loadFullDynamicSelfAccepting() {
        dynamicDataOutlet.value.innerHTML = 'qux loading'
        // This kind of dynamic import can't be analyzed and rewrited by vite
        import(
          dummy('./testHmrPropagationFullDynamicImportSelfAccepting')
        ).then(({ render }) => {
          render(dynamicDataOutlet.value)
        })
      }
    }
  }
}

// make the imported path unanalysable in build time
function dummy(value) {
  return value
}
</script>
