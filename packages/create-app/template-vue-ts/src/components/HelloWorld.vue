<template>
  <h1>{{ msg }}</h1>

  <p>
    <a href="https://vitejs.dev/guide/features.html" target="_blank">Vite Documentation</a> |
    <a href="https://v3.vuejs.org/" target="_blank">Vue 3 Documentation</a>
  </p>

  <p>
    Recommended IDE setup:
    <a href="https://code.visualstudio.com/" target="_blank">VSCode</a>
    +
    <a
      href="https://marketplace.visualstudio.com/items?itemName=octref.vetur"
      target="_blank"
    >Vetur</a>
    +
    <a
      href="https://marketplace.visualstudio.com/items?itemName=znck.vue-language-features"
      target="_blank"
    >Vue DX</a>
  </p>
  <p>
    If using &lt;script setup&gt;: use
    <a
      href="https://github.com/johnsoncodehk/volar"
      target="_blank"
    >Volar</a> instead (and disable Vetur)
  </p>
  <p>
    <b style="color:red">Make sure to use workspace version of TypeScript!!!</b>
    <br />This leverages the
    <code>@vuex/typescript-plugin-vue</code> to provide types for `*.vue` imports.
    <br />1. Open
    <code>src/main.ts</code> in VSCode
    <br />2. Open VSCode command input
    <br />3. Search and run "Select TypeScript version" -> "Use workspace version"
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
    return { count }
  }
})
</script>

<style scoped>
a {
  color: #42b983;
}
</style>