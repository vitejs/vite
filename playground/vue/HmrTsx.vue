<template>
  <h2 class="hmr-tsx">HMR</h2>
  <p>Click the button then edit this message. The count should be preserved.</p>
  <button class="hmr-tsx-inc" @click="count++">count is {{ count }}</button>
</template>

<script setup lang="tsx">
import { ref } from 'vue'

const count = ref(0)
</script>

<style>
.hmr-tsx-inc {
  color: red;
}
</style>
