<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Hello WebAssembly + Vue 3 + Vite" />
  <HelloWasm />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import HelloWasm from './components/HelloWasm.vue'

export default defineComponent({
  name: 'App',
  components: {
    HelloWorld,
    HelloWasm
  }
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>