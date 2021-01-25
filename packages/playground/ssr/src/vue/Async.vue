<template>
  <h1>{{ msg }}</h1>
  <img src="../assets/asset.png">
  <button @click="count++">{{ count }}</button>
</template>

<script setup>
import { ref } from 'vue'

const msg = 'Hello from Vue'

const count = ref(0)
// console.log('async evaluated')
</script>

<style scoped>
h1 {
  color: green;
}
</style>