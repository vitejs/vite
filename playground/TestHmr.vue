<template>
  <h2>Hot Module Replacement</h2>
  <p>
    <span>
      HMR: click button and edit template part of <code>./TestHmr.vue</code>,
      count should not reset
    </span>
    <button @click="count++">&gt;&gt;&gt; {{ count }} &lt;&lt;&lt;</button>
  </p>
  <p>
    <span>
      HMR: edit the return value of <code>foo()</code> in
      <code>./testHmrPropagation.js</code>, should update without reloading
      page:
    </span>
    <span>{{ foo() }}</span>
  </p>
  <p>
    HMR: manual API (see console) - edit <code>./testHmrManual.js</code> and it
    should log new exported value without reloading the page.
  </p>
</template>

<script>
import { foo } from "./testHmrPropagation";

export default {
  setup() {
    return {
      count: 0,
      foo,
    };
  },
};
</script>
