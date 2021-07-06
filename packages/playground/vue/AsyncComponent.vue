<template>
  <h2>Async Component</h2>
  <p>Testing TLA and for await compatibility with esbuild</p>
  <p class="async-component">ab == {{ test }}</p>
</template>

<script setup lang="ts">
let test = ''
const forAwaitTest = async (array): Promise<void> => {
  for await (const value of array) {
    test += value
  }
}
await forAwaitTest([Promise.resolve('a'), Promise.resolve('b')]).catch(() => {})
</script>
