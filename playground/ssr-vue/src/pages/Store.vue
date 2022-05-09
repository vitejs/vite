<template>
  <h1>{{ foo }}</h1>
</template>

<script>
import { createStore } from 'vuex'

export default {
  async setup() {
    const store = createStore({
      state: {
        foo: 'bar'
      }
    })
    return store.state
  }
}
</script>

<style scoped>
h1 {
  color: red;
}
</style>
