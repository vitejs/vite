<template>
  <h1>{{ msg }}</h1>
  <img src="../assets/asset.png">
</template>

<script setup>
const msg = 'Hello from Vue'

console.log('async evaluated')
</script>

<style scoped>
h1 {
  color: green;
}
</style>