<template>
  <h1>{{ msg }}</h1>

  <p>
    <a href="https://vitejs.dev/guide/features.html" target="_blank">Vite Documentation</a> |
    <a href="https://v3.vuejs.org/" target="_blank">Vue 3 Documentation</a>
  </p>

  <label>
    <input type="checkbox" v-model="toggle_1" /> use &lt;script setup&gt;
  </label>
  <label>
    <input type="checkbox" v-model="toggle_2" /> provide types for `*.vue` imports
  </label>

  <p>
    Recommended IDE setup:
    <a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
    +
    <template v-if="!toggle_1">
      <a
        href="https://marketplace.visualstudio.com/items?itemName=octref.vetur"
        target="_blank"
      >Vetur</a>
      +
      <a
        href="https://marketplace.visualstudio.com/items?itemName=znck.vue-language-features"
        target="_blank"
      >Vue DX</a>
    </template>
    <template v-else>
      <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
    </template>
  </p>
  <p v-if="toggle_2">
    tsconfig setup:
    <br />1. Add
    <code>@vuex/typescript-plugin-vue</code> to tsconfig plugins
    <br />2. Delete shims-vue.d.ts
    <br />3. Open
    <code>src/main.ts</code> in VSCode
    <br />4. Open VSCode command input
    <br />5. Search and run "Select TypeScript version" -> "Use workspace version"
  </p>
  <button @click="count++">count is: {{ count }}</button>
  <p>
    Edit
    <code>components/HelloWorld.vue</code> to test hot module replacement.
  </p>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'

export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: {
      type: String,
      required: true
    }
  },
  setup: () => {
    const count = ref(0)
    const toggle_1 = ref(false);
    const toggle_2 = ref(false);
    return { count, toggle_1, toggle_2 }
  }
})
</script>

<style scoped>
a {
  color: #42b983;
}
</style>