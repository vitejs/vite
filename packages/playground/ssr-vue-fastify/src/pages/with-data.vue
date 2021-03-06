<template>
  <h1 @click="refreshData">{{ data.message }}</h1>
</template>

<script>
import { ref } from 'vue'
import { getSSRData } from '../main'

export default {
  setup () {
    const data = ref(getSSRData())
    return {
      data,
      async refreshData () {
        const response = await fetch('/with-data/data')
        data.value = await response.json()
      }
    }
  }
}
</script>

<style scoped>
h1 {
  cursor: pointer;
  color: red;
}
</style>