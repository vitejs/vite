<template>
  <button @click="greet('webAssembly')">hello wasm</button>
</template>

<script lang="ts">
import init, { greet } from 'wasm-hello';
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'HelloWasm',
  setup: () => {
    // init wasm
    init();
    return { greet }
  }
})
</script>
