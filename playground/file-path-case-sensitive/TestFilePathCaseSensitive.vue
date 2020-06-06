<template>
  <h2>File path case sensitive</h2>
  <p class="file-path-case-sensitive">{{ data }}</p>
</template>

<script>
import { onMounted, ref } from 'vue'

export default {
  setup() {
    const data = ref()
    onMounted(() => {
      import('./DATA')
        .then(({ default: loaded }) => {
          data.value = loaded
        })
        .catch(() => {
          data.value = 'load fail'
        })
    })
    return {
      data
    }
  }
}
</script>
