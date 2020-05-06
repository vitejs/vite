<template>
  <div>
    <h2>JSX</h2>
    <div ref="root"></div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { renderPreact } from './testJsx.jsx'

export default {
  setup() {
    const root = ref()

    onMounted(() => {
      renderPreact(root.value)
    })

    return { root }
  }
}
</script>
