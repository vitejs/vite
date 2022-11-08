<template>
  <h1>{{ fooStore.foo }}</h1>
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
    const fooStore = useFooStore()
    return { fooStore }
  }
}
</script>

<style scoped>
h1 {
  color: red;
}
</style>
