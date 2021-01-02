<template>
  <h1>{{ msg }}</h1>
  <p>
    Recommended setup:
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
    Make sure to use workspace version of TypeScript to get improved support via
    <a
      href="https://github.com/znck/vue-developer-experience"
      target="_blank"
    >@vuedx</a>.
    <br />Note @vuedx is still experimental and this setup is provided for early feedback.
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
