<template>
  <h1>{{ message }}</h1>
</template>

<script>
import { getSSRData } from '../main'

export default {
  setup () {
    const x = getSSRData()
    console.log('x->', x)
    return x
  }
}
</script>

<style scoped>
h1 {
  color: red;
}
</style>