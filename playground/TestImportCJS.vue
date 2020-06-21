<template>
  <h2>import CJS</h2>
  <div>{{ value }}</div>
  <button @click="refresh">refresh</button>
</template>

<script>
import random from 'lodash/random'

export default {
  data() {
    return {
      value: random(0, 10)
    }
  },
  methods: {
    refresh() {
      this.value = random(0, 10)
    }
  }
}
</script>
