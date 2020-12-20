<template>
  <h2 class="hmr">HMR</h2>
  <p>Click the button then edit this message. The count should be preserved.</p>
  <button class="hmr-inc" @click="count++">count is {{ count }}</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'

let foo: number = 0

const count = ref(foo)
</script>

<style>
.hmr-inc {
  color: red;
}
</style>