<template>
  <h2>Vue SFC HMRsfsefefs {{ count }}</h2>
  <p>Click the button then edit this message. The count should be preserved.</p>
  <div>filler</div>
  <button @click="count++">count is {{ count }}</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

let foo: number = 0

console.log('wo')
const count = ref(foo)
</script>
