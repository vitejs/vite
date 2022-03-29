<template>
  <h2>worker template error match</h2>
  <code>
    const worker = new Worker(new URL('./worker.js', import.meta.url))
  </code>
  <div class="vue-worker">{{ message }}</div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('')
const worker = new Worker(new URL('./workerTest.js', import.meta.url))
worker.addEventListener('message', (ev) => {
  message.value = ev.data
})
</script>
