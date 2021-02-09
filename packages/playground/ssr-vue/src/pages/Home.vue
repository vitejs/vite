<template>
  <h1>Home</h1>
  <p>
    <img src="../assets/logo.png" alt="logo" />
  </p>
  <button @click="state.count++">count is: {{ state.count }}</button>
  <Foo />
</template>

<script setup>
import { reactive, defineAsyncComponent } from 'vue'
const Foo = defineAsyncComponent(() => import('../components/Foo').then(mod => mod.Foo))

const state = reactive({ count: 0 })
</script>

<style scoped>
h1,
a {
  color: green;
}
</style>