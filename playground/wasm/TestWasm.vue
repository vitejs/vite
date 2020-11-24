<template>
  <h2>Wasm</h2>
  <p>
    <button class="run-inline-wasm" @click="runInline">Click to run inline wasm</button>
    This should be 42 -> <span class="inline-wasm-response">{{ inlineResponse }}</span>
  </p>
  <p>
    <button class="run-file-wasm" @click="runFile">Click to run file wasm</button>
    This should be * -> <span class="file-wasm-response">{{ fileResponse }}</span>
  </p>
</template>

<script>
import { ref } from 'vue'
import initInline from './simple.wasm'
import initFile from './complex.wasm'

function decodeCString(memory, pointer) {
  const data = new Uint16Array(memory.buffer, pointer)
  let i = -1, str = ""
  while(data[++i] > 0) {
    str += String.fromCodePoint(data[i])
  }
  return i > 0 ? str : null
}

export default {
  async setup() {
    const inlineResponse = ref()
    const { exported_func: runInline } = await initInline({
      imports: {
        imported_func: (value) => {
          inlineResponse.value = value
        }
      }
    })

    const fileResponse = ref()
    const memory = new WebAssembly.Memory({ initial: 1 })
    const { exported_func: runFile } = await initFile({
      env: {
        memory
      },
      imports: {
        imported_func: (pointer) => {
          fileResponse.value = decodeCString(memory, pointer)
        }
      }
    })

    return {
      inlineResponse,
      runInline,
      fileResponse,
      runFile
    }
  }
}
</script>
