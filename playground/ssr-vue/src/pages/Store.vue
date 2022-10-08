<template>
  <h1>{{ foo }}</h1>
</template>

<script>
import { defineStore } from 'pinia'

export default {
  async setup() {
    const useFooStore = defineStore('foo-store', {
      state: () => ({
        foo: 'bar'
      })
    })
    return useFooStore()
  }
}
</script>

<style scoped>
h1 {
  color: red;
}
</style>
