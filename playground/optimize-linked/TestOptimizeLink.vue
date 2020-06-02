<template>
  <h2>Optimize Linked Dep</h2>
  <p class="optimize-linked" :style="{ color: msg === 'ok' ? 'green' : 'red' }">
    {{ msg }}
  </p>
</template>

<script>
import { bar } from 'optimize-linked'

export default {
  data() {
    return {
      msg: bar() === 'linked-dep' ? 'ok' : 'error'
    }
  }
}
</script>
