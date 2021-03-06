<template>
  <h1>Home</h1>
  <p>
    <img src="../assets/logo.png" alt="logo" />
  </p>
  <p>SSR data: {{ ssrData }}</p>
  <button @click="state.count++">count is: {{ state.count }}</button>
  <Foo />
  <p class="virtual">msg from virtual module: {{ foo.msg }}</p>
</template>

<script setup>
import { getSSRData } from '../main'
import foo from '@foo'
import { ref, reactive, defineAsyncComponent } from 'vue'

const ssrData = getSSRData()
const Foo = defineAsyncComponent(() => import('../components/Foo').then(mod => mod.Foo))

const state = reactive({ count: 0 })
</script>

<style scoped>
h1,
a {
  color: green;
}
</style>