<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <h1>Get started</h1>
  <button class="counter" @click="count++">Count is {{ count }}</button>
</template>
