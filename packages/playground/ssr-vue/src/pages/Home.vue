<template>
  <h1>Home</h1>
  <p>
    <img src="../assets/logo.png" alt="logo" />
  </p>
  <button @click="state.count++">count is: {{ state.count }}</button>
  <p class="virtual">msg from virtual module: foo.msg </p>
  <p class="inter">this will be styled with a font-face</p>

</template>

<script setup>
import { reactive } from 'vue'

const state = reactive({ count: 0 })
</script>

<style scoped>
h1,
a {
  color: green;
}
</style>
