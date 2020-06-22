<template>
  <h2>Wasm</h2>
  <p>
    <button class="wasm-send" @click="run">Click to run wasm</button>
    <span class="wasm-response">{{ res }}</span>
  </p>
</template>

<script>
import { ref } from 'vue'
import init from './simple.wasm'

export default {
  async setup() {
    const res = ref()

    const { exported_func } = await init({
      imports: {
        imported_func: (arg) => {
          res.value = `Wasm result: ${arg}`
        }
      }
    })

    return {
      res,
      run: exported_func
    }
  }
}
</script>
